import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BayseAssetResponseDto,
  BayseSearchResultDto,
  BayseMarketTrendDto,
  BaysePriceHistoryDto,
  BaysePortfolioPriceDto,
  BayseAnomalyDetectionDto,
} from './dto/bayse-response.dto';
import { TimeFrame } from './dto/get-asset.dto';

interface BayseApiAsset {
  symbol: string;
  name?: string;
  price: number;
  change_24h?: number;
  volume?: number;
  market_cap?: number;
  currency?: string;
  type?: string;
}

interface BayseApiSearchResult {
  symbol: string;
  name: string;
  type?: string;
}

interface BayseApiPricePoint {
  timestamp: string;
  price: number;
  volume: number;
}

@Injectable()
export class BayseService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(BayseService.name);

  // Cache for rate limiting (5 minutes)
  private priceCache: Map<string, { data: BayseAssetResponseDto; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BAYSE_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('BAYSE_API_URL') || 'https://api.bayse.io/v1';
    
    if (!this.apiKey) {
      this.logger.warn('BAYSE_API_KEY not configured - API calls will fail');
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private transformAsset(data: BayseApiAsset): BayseAssetResponseDto {
    return {
      symbol: data.symbol,
      name: data.name || data.symbol,
      price: data.price,
      change24h: data.change_24h || 0,
      volume: data.volume || 0,
      marketCap: data.market_cap,
      currency: data.currency || 'USD',
      type: data.type || 'unknown',
    };
  }

  /**
   * Get single asset price and details
   * PRD: Live Market Dashboard - Real-time price feed
   */
  async getAssetPrice(symbol: string): Promise<BayseAssetResponseDto> {
    // Check cache first
    const cached = this.priceCache.get(symbol.toUpperCase());
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/assets/${symbol.toUpperCase()}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Bayse API error: ${response.status} - ${response.statusText}`);
      }

      const data: BayseApiAsset = await response.json();
      const transformed = this.transformAsset(data);

      // Cache the result
      this.priceCache.set(symbol.toUpperCase(), { data: transformed, timestamp: Date.now() });

      return transformed;
    } catch (error) {
      this.logger.error(`Failed to fetch asset ${symbol}: ${(error as Error).message}`);
      throw new HttpException(
        `Failed to fetch ${symbol}: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get multiple assets in one call
   * PRD: Portfolio Builder - compute current value per holding
   */
  async getMultipleAssets(symbols: string[]): Promise<BayseAssetResponseDto[]> {
    const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];
    const results: BayseAssetResponseDto[] = [];

    // Process in batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
      const batch = uniqueSymbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getAssetPrice(symbol).catch(err => {
        this.logger.warn(`Failed to fetch ${symbol}: ${err.message}`);
        return null;
      }));
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(Boolean) as BayseAssetResponseDto[]);
    }

    return results;
  }

  /**
   * Search for assets by query
   * PRD: Portfolio Builder - symbol search powered by Bayse API
   */
  async searchAssets(query: string): Promise<BayseSearchResultDto[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Bayse API search error: ${response.status}`);
      }

      const data = await response.json();
      const results: BayseApiSearchResult[] = data.results || data.assets || [];
      
      return results.map(item => ({
        symbol: item.symbol,
        name: item.name || item.symbol,
        type: item.type || 'unknown',
      }));
    } catch (error) {
      this.logger.error(`Failed to search assets: ${(error as Error).message}`);
      throw new HttpException(
        `Search failed: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get price history for an asset
   * PRD: Risk History Chart (P1) - time-series of risk score
   */
  async getAssetHistory(symbol: string, timeframe: TimeFrame = TimeFrame['24H']): Promise<BaysePriceHistoryDto> {
    try {
      const response = await fetch(
        `${this.baseUrl}/assets/${symbol.toUpperCase()}/history?timeframe=${timeframe}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Bayse API history error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        symbol: symbol.toUpperCase(),
        timeframe,
        data: (data.history || data.data || []).map((point: BayseApiPricePoint) => ({
          timestamp: point.timestamp,
          price: point.price,
          volume: point.volume || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch history for ${symbol}: ${(error as Error).message}`);
      throw new HttpException(
        `Failed to fetch history for ${symbol}: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get market trends/top assets
   * PRD: Live Market Dashboard - market overview
   */
  async getMarketTrends(limit: number = 10): Promise<BayseMarketTrendDto[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/market/trends?limit=${limit}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Bayse API trends error: ${response.status}`);
      }

      const data = await response.json();
      const trends = data.trends || data.top || [];

      return trends.map((item: BayseApiAsset) => ({
        symbol: item.symbol,
        name: item.name || item.symbol,
        price: item.price,
        change24h: item.change_24h || 0,
        trend: (item.change_24h || 0) > 0 ? 'bullish' : (item.change_24h || 0) < 0 ? 'bearish' : 'neutral',
        volatility: this.calculateVolatility(item.change_24h),
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch market trends: ${(error as Error).message}`);
      throw new HttpException(
        `Failed to fetch market trends: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Calculate portfolio values with live prices
   * PRD: Portfolio Builder - compute current value per holding
   */
  async calculatePortfolioValues(
    holdings: Array<{ symbol: string; quantity: number }>
  ): Promise<BaysePortfolioPriceDto[]> {
    const symbols = holdings.map(h => h.symbol);
    const prices = await this.getMultipleAssets(symbols);
    
    const priceMap = new Map(prices.map(p => [p.symbol, p]));

    return holdings.map(holding => {
      const priceData = priceMap.get(holding.symbol.toUpperCase());
      if (!priceData) {
        return null;
      }

      const currentValue = Number(holding.quantity) * priceData.price;
      const change24hValue = currentValue * (priceData.change24h / 100);

      return {
        symbol: holding.symbol.toUpperCase(),
        quantity: Number(holding.quantity),
        currentPrice: priceData.price,
        currentValue: Math.round(currentValue * 100) / 100,
        change24h: priceData.change24h,
        change24hValue: Math.round(change24hValue * 100) / 100,
      };
    }).filter(Boolean) as BaysePortfolioPriceDto[];
  }

  /**
   * Detect anomalies in asset prices
   * PRD: Anomaly Detection - flag unusual price movements/volatility spikes
   */
  async detectAnomalies(symbols: string[]): Promise<BayseAnomalyDetectionDto[]> {
    const anomalies: BayseAnomalyDetectionDto[] = [];
    const assets = await this.getMultipleAssets(symbols);

    for (const asset of assets) {
      const anomaly = this.analyzeAssetAnomaly(asset);
      if (anomaly.isAnomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Internal: Analyze single asset for anomalies
   */
  private analyzeAssetAnomaly(asset: BayseAssetResponseDto): BayseAnomalyDetectionDto {
    const deviationPercent = Math.abs(asset.change24h);
    let isAnomaly = false;
    let reason = '';
    let severity: 'low' | 'medium' | 'high' = 'low';

    // High price change threshold ( > 10% in 24h is unusual)
    if (deviationPercent > 10) {
      isAnomaly = true;
      severity = 'high';
      const direction = asset.change24h > 0 ? 'increase' : 'decrease';
      reason = `Unusual price movement: ${deviationPercent.toFixed(1)}% ${direction} in 24h`;
    } else if (deviationPercent > 5) {
      isAnomaly = true;
      severity = 'medium';
      const direction = asset.change24h > 0 ? 'increase' : 'decrease';
      reason = `Notable price movement: ${deviationPercent.toFixed(1)}% ${direction} in 24h`;
    } else if (asset.volume && asset.marketCap) {
      // High volume relative to market cap indicates unusual activity
      const volumeRatio = asset.volume / asset.marketCap;
      if (volumeRatio > 0.1) {
        isAnomaly = true;
        severity = 'medium';
        reason = `Unusual trading volume: ${(volumeRatio * 100).toFixed(1)}% of market cap`;
      }
    }

    // If no anomaly detected
    if (!isAnomaly) {
      reason = 'No anomalies detected';
    }

    return {
      symbol: asset.symbol,
      isAnomaly,
      reason,
      severity,
      deviationPercent: Math.round(deviationPercent * 10) / 10,
    };
  }

  /**
   * Calculate volatility score (0-1) from price change
   */
  private calculateVolatility(change24h?: number): number {
    if (!change24h) return 0;
    const absChange = Math.abs(change24h);
    // Normalize: 0% = 0 volatility, 10%+ = 1.0 volatility
    return Math.min(absChange / 10, 1);
  }

  /**
   * Clear price cache (for testing or manual refresh)
   */
  clearCache(): void {
    this.priceCache.clear();
    this.logger.log('Price cache cleared');
  }

  /**
   * Get cache status (for monitoring)
   */
  getCacheStatus(): { size: number; oldestEntry: number | null } {
    let oldest: number | null = null;
    for (const entry of this.priceCache.values()) {
      if (!oldest || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    return { size: this.priceCache.size, oldestEntry: oldest };
  }
}