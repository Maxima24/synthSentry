import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// ── Raw API shapes ─────────────────────────────────────────────────────────────

interface BayseMarket {
  id: string;
  title: string;
  status: string;
  outcome1Id: string;
  outcome1Label: string;
  outcome1Price: number;
  outcome2Id: string;
  outcome2Label: string;
  outcome2Price: number;
  yesBuyPrice: number;
  noBuyPrice: number;
  feePercentage: number;
  totalOrders: number;
  rules: string;
  marketThreshold?: number;
  marketThresholdRange?: string;
  marketCloseValue?: number;
  // derived helper — populated by transformEvent
  outcome?: 'YES' | 'NO';
}

interface BayseEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  type: 'single' | 'combined';
  engine: 'AMM' | 'CLOB';
  status: string;
  resolutionDate: string;
  closingDate: string;
  imageUrl?: string;
  liquidity: number;
  totalVolume: number;
  totalOrders: number;
  supportedCurrencies: string[];
  userWatchlisted: boolean;
  assetSymbolPair?: string;
  eventThreshold?: number;
  seriesSlug?: string;
  markets: BayseMarket[];
}

interface BaysePortfolioPosition {
  id: string;
  outcome: 'YES' | 'NO';
  outcomeId: string;
  balance: number;
  availableBalance: number;
  averagePrice: number;
  cost: number;
  currentValue: number;
  sellPrice: number;
  payoutIfOutcomeWins: number;
  percentageChange: number;
  currency: string;
  market: {
    id: string;
    title: string;
    event: {
      id: string;
      title: string;
      type: string;
      engine: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface BayseTickerResponse {
  marketId: string;
  outcome: string;
  lastPrice: number;
  bestBid: number;
  bestAsk: number;
  midPrice: number;
  spread: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  tradeCount24h: number;
  timestamp: string;
}

interface BayseWalletAsset {
  id: string;
  symbol: string;
  userId: string;
  network: string;
  availableBalance: number;
  pendingBalance: number;
  depositActivity: 'ACTIVE' | 'SUSPENDED';
  withdrawalActivity: 'ACTIVE' | 'SUSPENDED';
  wagerActivity: 'ACTIVE' | 'SUSPENDED';
  isDefault: boolean;
  isLocalCurrencyAsset: boolean;
  addresses: Array<{
    id: string;
    address: string;
    symbol: string;
    provider: string;
    network: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ── DTO shapes ─────────────────────────────────────────────────────────────────

export interface BayseMarketDto {
  id: string;
  title: string;
  status: string;
  outcome1Label: string;
  outcome1Price: number;
  outcome2Label: string;
  outcome2Price: number;
  yesBuyPrice: number;
  noBuyPrice: number;
  totalOrders: number;
  // default outcome for this market (always YES for first market)
  outcome: 'YES' | 'NO';
}

export interface BayseEventDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  resolutionDate: string;
  liquidity: number;
  totalVolume: number;
  totalOrders: number;
  yesPrice: number;
  noPrice: number;
  impliedProbability: number;
  markets: BayseMarketDto[];
}

export interface BaysePortfolioDto {
  positions: Array<{
    id: string;
    eventTitle: string;
    marketTitle: string;
    outcome: 'YES' | 'NO';
    shares: number;
    averagePrice: number;
    cost: number;
    currentValue: number;
    percentageChange: number;
    payoutIfWins: number;
    currency: string;
  }>;
  totalCost: number;
  totalCurrentValue: number;
  totalPercentageChange: number;
}

export interface BayseTickerDto {
  marketId: string;
  lastPrice: number;
  midPrice: number;
  spread: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  timestamp: string;
}

export interface BayseWalletDto {
  assets: Array<{
    symbol: string;
    availableBalance: number;
    pendingBalance: number;
    isDefault: boolean;
    depositActive: boolean;
    withdrawalActive: boolean;
  }>;
  totalUsd: number;
  totalNgn: number;
}

export interface BayseMarketTrendDto {
  eventId: string;
  title: string;
  category: string;
  yesPrice: number;
  totalVolume: number;
  liquidity: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class BayseService {
  private readonly logger = new Logger(BayseService.name);
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly baseUrl = 'https://relay.bayse.markets/v1';

  private cache = new Map<string, { data: unknown; ts: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(private configService: ConfigService) {
    this.publicKey = this.configService.get<string>('BAYSE_API_KEY') || '';
    this.secretKey = this.configService.get<string>('BAYSE_SECRET_KEY') || '';

    if (!this.publicKey || !this.secretKey) {
      this.logger.warn('BAYSE_PUBLIC_KEY or BAYSE_SECRET_KEY not configured');
    }
  }

  // ── Auth header builders ───────────────────────────────────────────────────

  private publicHeaders(): HeadersInit {
    return { 'Content-Type': 'application/json' };
  }

  private readHeaders(): HeadersInit {
    return {
      'X-Public-Key': this.publicKey,
      'Content-Type': 'application/json',
    };
  }

  private writeHeaders(method: string, path: string, body?: string): HeadersInit {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyHash = body
      ? crypto.createHash('sha256').update(body).digest('hex')
      : '';

    const payload = `${timestamp}.${method.toUpperCase()}.${path}.${bodyHash}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('base64');

    return {
      'X-Public-Key': this.publicKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'Content-Type': 'application/json',
    };
  }

  // ── Core fetch ─────────────────────────────────────────────────────────────

  private async get<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    authLevel: 'public' | 'read' = 'public',
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.set(k, String(v)),
      );
    }

    const cacheKey = `${authLevel}:${url.toString()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
      return cached.data as T;
    }

    const headers =
      authLevel === 'read' ? this.readHeaders() : this.publicHeaders();
    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        `Bayse ${response.status}: ${(body as any).message || response.statusText}`,
      );
    }

    const data = (await response.json()) as T;
    this.cache.set(cacheKey, { data, ts: Date.now() });
    return data;
  }

  private async post<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const rawBody = JSON.stringify(body);
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.writeHeaders('POST', path, rawBody),
      body: rawBody,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Bayse ${response.status}: ${(err as any).message || response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.writeHeaders('DELETE', path),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Bayse ${response.status}: ${(err as any).message || response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private handleError(context: string, error: unknown): never {
    const message = (error as Error).message;
    this.logger.error(`${context}: ${message}`);
    throw new HttpException(message, HttpStatus.SERVICE_UNAVAILABLE);
  }

  // ── Public methods ─────────────────────────────────────────────────────────

  async listEvents(
    opts: {
      keyword?: string;
      category?: string;
      status?: string;
      trending?: boolean;
      currency?: 'USD' | 'NGN';
      page?: number;
      size?: number;
    } = {},
  ): Promise<{
    events: BayseEventDto[];
    totalCount: number;
    lastPage: number;
  }> {
    try {
      const params: Record<string, string | number | boolean> = {
        currency: opts.currency ?? 'USD',
        page: opts.page ?? 1,
        size: opts.size ?? 20,
      };
      if (opts.keyword) params.keyword = opts.keyword;
      if (opts.category) params.category = opts.category;
      if (opts.status) params.status = opts.status;
      if (opts.trending) params.trending = true;

      const data = await this.get<{
        events: BayseEvent[];
        pagination: any;
      }>('/pm/events', params, 'public');

      return {
        events: data.events.map(this.transformEvent),
        totalCount: data.pagination.totalCount,
        lastPage: data.pagination.lastPage,
      };
    } catch (e) {
      this.handleError('listEvents', e);
    }
  }

  async getEvent(eventId: string): Promise<BayseEventDto> {
    try {
      const data = await this.get<BayseEvent>(
        `/pm/events/${eventId}`,
        undefined,
        'public',
      );
      return this.transformEvent(data);
    } catch (e) {
      this.handleError(`getEvent(${eventId})`, e);
    }
  }

  async getEventBySlug(slug: string): Promise<BayseEventDto> {
    try {
      const data = await this.get<BayseEvent>(
        `/pm/events/slug/${slug}`,
        undefined,
        'public',
      );
      return this.transformEvent(data);
    } catch (e) {
      this.handleError(`getEventBySlug(${slug})`, e);
    }
  }

  async getMarketTicker(
    marketId: string,
    outcome: 'YES' | 'NO' = 'YES',
  ): Promise<BayseTickerDto> {
    try {
      const data = await this.get<BayseTickerResponse>(
        `/pm/markets/${marketId}/ticker`,
        { outcome },
        'public',
      );
      return {
        marketId: data.marketId,
        lastPrice: data.lastPrice,
        midPrice: data.midPrice,
        spread: data.spread,
        volume24h: data.volume24h,
        high24h: data.high24h,
        low24h: data.low24h,
        priceChange24h: data.priceChange24h,
        timestamp: data.timestamp,
      };
    } catch (e) {
      this.handleError(`getMarketTicker(${marketId})`, e);
    }
  }

  async getTrendingEvents(limit = 10): Promise<BayseMarketTrendDto[]> {
    try {
      const { events } = await this.listEvents({
        trending: true,
        size: limit,
        status: 'open',
      });
      return events.map((e) => ({
        eventId: e.id,
        title: e.title,
        category: e.category,
        yesPrice: e.yesPrice,
        totalVolume: e.totalVolume,
        liquidity: e.liquidity,
        trend:
          e.yesPrice > 0.5
            ? 'bullish'
            : e.yesPrice < 0.5
              ? 'bearish'
              : 'neutral',
      }));
    } catch (e) {
      this.handleError('getTrendingEvents', e);
    }
  }

  async getPortfolio(
    opts: { page?: number; size?: number } = {},
  ): Promise<BaysePortfolioDto> {
    try {
      const data = await this.get<{
        outcomeBalances: BaysePortfolioPosition[];
        portfolioCost: number;
        portfolioCurrentValue: number;
        portfolioPercentageChange: number;
      }>(
        '/pm/portfolio',
        { page: opts.page ?? 1, size: opts.size ?? 20 },
        'read',
      );

      return {
        positions: data.outcomeBalances.map((p) => ({
          id: p.id,
          eventTitle: p.market.event.title,
          marketTitle: p.market.title,
          outcome: p.outcome,
          shares: p.balance,
          averagePrice: p.averagePrice,
          cost: p.cost,
          currentValue: p.currentValue,
          percentageChange: p.percentageChange,
          payoutIfWins: p.payoutIfOutcomeWins,
          currency: p.currency,
        })),
        totalCost: data.portfolioCost,
        totalCurrentValue: data.portfolioCurrentValue,
        totalPercentageChange: data.portfolioPercentageChange,
      };
    } catch (e) {
      this.handleError('getPortfolio', e);
    }
  }

  async getWalletAssets(): Promise<BayseWalletDto> {
    try {
      const data = await this.get<{ assets: BayseWalletAsset[] }>(
        '/wallet/assets',
        undefined,
        'read',
      );

      const usdAsset = data.assets.find((a) => a.symbol === 'USD');
      const ngnAsset = data.assets.find((a) => a.symbol === 'NGN');

      return {
        assets: data.assets.map((a) => ({
          symbol: a.symbol,
          availableBalance: a.availableBalance,
          pendingBalance: a.pendingBalance,
          isDefault: a.isDefault,
          depositActive: a.depositActivity === 'ACTIVE',
          withdrawalActive: a.withdrawalActivity === 'ACTIVE',
        })),
        totalUsd: usdAsset?.availableBalance ?? 0,
        totalNgn: ngnAsset?.availableBalance ?? 0,
      };
    } catch (e) {
      this.handleError('getWalletAssets', e);
    }
  }

  async analysePortfolioRisk(): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
    summary: string;
  }> {
    const portfolio = await this.getPortfolio({ size: 100 });
    const flags: string[] = [];

    if (portfolio.positions.length === 0) {
      return { riskLevel: 'low', flags: [], summary: 'No open positions.' };
    }

    for (const pos of portfolio.positions) {
      const share = pos.cost / portfolio.totalCost;
      if (share > 0.5) {
        flags.push(
          `High concentration: ${pos.eventTitle} (${(share * 100).toFixed(1)}% of portfolio)`,
        );
      }
    }

    const longShots = portfolio.positions.filter((p) => p.averagePrice < 0.2);
    if (longShots.length > 0) {
      flags.push(
        `${longShots.length} long-shot position(s) with <20% implied probability`,
      );
    }

    const losers = portfolio.positions.filter((p) => p.percentageChange < -20);
    if (losers.length > 0) {
      flags.push(`${losers.length} position(s) down more than 20%`);
    }

    if (portfolio.totalPercentageChange < -15) {
      flags.push(
        `Portfolio is down ${Math.abs(portfolio.totalPercentageChange).toFixed(1)}% overall`,
      );
    }

    const riskLevel =
      flags.length === 0 ? 'low' : flags.length <= 2 ? 'medium' : 'high';

    return {
      riskLevel,
      flags,
      summary:
        flags.length === 0
          ? 'Portfolio looks well-balanced with no major risk flags.'
          : `${flags.length} risk flag(s) detected across ${portfolio.positions.length} position(s).`,
    };
  }

  // ── Cache utilities ────────────────────────────────────────────────────────

  clearCache(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  getCacheStatus(): { size: number } {
    return { size: this.cache.size };
  }

  // ── Transformers ───────────────────────────────────────────────────────────

  private transformEvent(e: BayseEvent): BayseEventDto {
    const firstMarket = e.markets[0];
    return {
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      category: e.category,
      status: e.status,
      resolutionDate: e.resolutionDate,
      liquidity: e.liquidity,
      totalVolume: e.totalVolume,
      totalOrders: e.totalOrders,
      yesPrice: firstMarket?.outcome1Price ?? 0,
      noPrice: firstMarket?.outcome2Price ?? 0,
      impliedProbability: (firstMarket?.outcome1Price ?? 0) * 100,
      // expose markets as BayseMarketDto so addHolding can read marketId + outcome
      markets: (e.markets ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        outcome1Label: m.outcome1Label,
        outcome1Price: m.outcome1Price,
        outcome2Label: m.outcome2Label,
        outcome2Price: m.outcome2Price,
        yesBuyPrice: m.yesBuyPrice,
        noBuyPrice: m.noBuyPrice,
        totalOrders: m.totalOrders,
        outcome: 'YES' as const, // first market defaults to YES side
      })),
    };
  }
}