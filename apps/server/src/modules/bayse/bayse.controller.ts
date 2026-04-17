import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BayseService } from './bayse.service';
import {
  GetAssetDto,
  GetAssetHistoryDto,
  SearchAssetsDto,
  GetMultipleAssetsDto,
  TimeFrame,
} from './dto/get-asset.dto';
import {
  BayseAssetResponseDto,
  BayseSearchResultDto,
  BayseMarketTrendDto,
  BaysePriceHistoryDto,
  BaysePortfolioPriceDto,
  BayseAnomalyDetectionDto,
} from './dto/bayse-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/common/utils/jwt-strategy.utils';

@ApiTags('bayse')
@Controller('bayse')
export class BayseController {
  constructor(private readonly bayseService: BayseService) {}

  /**
   * Get single asset price and details
   * PRD: Live Market Dashboard - Real-time price feed
   */
  @Get('assets/:symbol')
  @ApiOperation({ summary: 'Get single asset price and details' })
  @ApiParam({ name: 'symbol', example: 'BTC', description: 'Asset symbol' })
  @ApiResponse({
    status: 200,
    description: 'Asset price data',
    type: BayseAssetResponseDto,
  })
  @ApiResponse({ status: 503, description: 'Bayse API unavailable' })
  async getAsset(@Param() params: GetAssetDto): Promise<BayseAssetResponseDto> {
    return this.bayseService.getAssetPrice(params.symbol);
  }

  /**
   * Get multiple assets prices
   * PRD: Portfolio Builder - compute current value per holding
   */
  @Post('assets/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get multiple assets prices' })
  @ApiBody({ type: GetMultipleAssetsDto })
  @ApiResponse({
    status: 200,
    description: 'Array of asset prices',
    type: [BayseAssetResponseDto],
  })
  async getMultipleAssets(
    @Body() body: GetMultipleAssetsDto,
  ): Promise<BayseAssetResponseDto[]> {
    return this.bayseService.getMultipleAssets(body.symbols);
  }

  /**
   * Search for assets
   * PRD: Portfolio Builder - symbol search powered by Bayse API
   */
  @Get('search')
  @ApiOperation({ summary: 'Search for assets by query' })
  @ApiQuery({ name: 'q', example: 'bitcoin', description: 'Search query' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [BayseSearchResultDto],
  })
  async searchAssets(@Query('q') query: string): Promise<BayseSearchResultDto[]> {
    return this.bayseService.searchAssets(query);
  }

  /**
   * Get asset price history
   * PRD: Risk History Chart (P1) - time-series of risk score
   */
  @Get('assets/:symbol/history')
  @ApiOperation({ summary: 'Get asset price history' })
  @ApiParam({ name: 'symbol', example: 'BTC', description: 'Asset symbol' })
  @ApiQuery({
    name: 'timeframe',
    enum: TimeFrame,
    example: '24h',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Price history data',
    type: BaysePriceHistoryDto,
  })
  async getAssetHistory(
    @Param() params: GetAssetDto,
    @Query('timeframe') timeframe?: TimeFrame,
  ): Promise<BaysePriceHistoryDto> {
    return this.bayseService.getAssetHistory(
      params.symbol,
      timeframe || TimeFrame['24H'],
    );
  }

  /**
   * Get market trends/top assets
   * PRD: Live Market Dashboard - market overview
   */
  @Get('market/trends')
  @ApiOperation({ summary: 'Get market trends and top assets' })
  @ApiQuery({ name: 'limit', example: '10', required: false })
  @ApiResponse({
    status: 200,
    description: 'Market trends',
    type: [BayseMarketTrendDto],
  })
  async getMarketTrends(
    @Query('limit') limit?: number,
  ): Promise<BayseMarketTrendDto[]> {
    return this.bayseService.getMarketTrends(limit || 10);
  }

  /**
   * Calculate portfolio values with live prices
   * PRD: Portfolio Builder - compute current value per holding
   */
  @Post('portfolio/values')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate portfolio values with live prices' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        holdings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string', example: 'BTC' },
              quantity: { type: 'number', example: 2.5 },
            },
          },
          example: [
            { symbol: 'BTC', quantity: 2.5 },
            { symbol: 'ETH', quantity: 10 },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio values with live prices',
    type: [BaysePortfolioPriceDto],
  })
  async calculatePortfolioValues(
    @Body() body: { holdings: Array<{ symbol: string; quantity: number }> },
  ): Promise<BaysePortfolioPriceDto[]> {
    return this.bayseService.calculatePortfolioValues(body.holdings);
  }

  /**
   * Detect anomalies in asset prices
   * PRD: Anomaly Detection - flag unusual price movements/volatility spikes
   */
  @Post('anomalies')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detect anomalies in asset prices' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          example: ['BTC', 'ETH', 'AAPL'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Detected anomalies',
    type: [BayseAnomalyDetectionDto],
  })
  async detectAnomalies(
    @Body() body: { symbols: string[] },
  ): Promise<BayseAnomalyDetectionDto[]> {
    return this.bayseService.detectAnomalies(body.symbols);
  }

  /**
   * Health check for Bayse API
   */
  @Get('health')
  @ApiOperation({ summary: 'Check Bayse API health and cache status' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
  })
  async healthCheck() {
    const cacheStatus = this.bayseService.getCacheStatus();
    return {
      status: 'ok',
      service: 'Bayse API',
      cache: cacheStatus,
      timestamp: new Date().toISOString(),
    };
  }
}