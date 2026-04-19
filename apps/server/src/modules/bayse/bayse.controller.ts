import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/common/utils/jwt-strategy.utils';
import { BayseService } from './bayse.service';

@ApiTags('bayse')
@Controller('bayse')
export class BayseController {
  constructor(private readonly bayseService: BayseService) {}

  /**
   * List / search prediction market events
   * Replaces: GET /bayse/search  +  GET /bayse/assets/:symbol
   */
  @Get('events')
  @ApiOperation({ summary: 'List or search prediction market events' })
  @ApiQuery({ name: 'keyword',  required: false, example: 'bitcoin' })
  @ApiQuery({ name: 'category', required: false, example: 'crypto', description: 'crypto | sports | politics' })
  @ApiQuery({ name: 'status',   required: false, example: 'open',   description: 'open | closed | resolved' })
  @ApiQuery({ name: 'trending', required: false, type: Boolean })
  @ApiQuery({ name: 'currency', required: false, example: 'USD', description: 'USD | NGN' })
  @ApiQuery({ name: 'page',     required: false, example: 1 })
  @ApiQuery({ name: 'size',     required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated list of events' })
  @ApiResponse({ status: 503, description: 'Bayse API unavailable' })
  async listEvents(
    @Query('keyword')  keyword?: string,
    @Query('category') category?: string,
    @Query('status')   status?: string,
    @Query('trending') trending?: string,
    @Query('currency') currency?: 'USD' | 'NGN',
    @Query('page', new DefaultValuePipe(1),  ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size?: number,
  ) {
    return this.bayseService.listEvents({
      keyword,
      category,
      status,
      trending: trending === 'true',
      currency,
      page,
      size,
    });
  }

  /**
   * Get a single event by ID
   * Replaces: GET /bayse/assets/:symbol
   */
  @Get('events/:eventId')
  @ApiOperation({ summary: 'Get a prediction market event by ID' })
  @ApiParam({ name: 'eventId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 503, description: 'Bayse API unavailable' })
  async getEvent(@Param('eventId') eventId: string) {
    return this.bayseService.getEvent(eventId);
  }

  /**
   * Get a single event by slug
   */
  @Get('events/slug/:slug')
  @ApiOperation({ summary: 'Get a prediction market event by slug' })
  @ApiParam({ name: 'slug', example: 'super-eagles-afcon-2026' })
  @ApiResponse({ status: 200, description: 'Event details' })
  async getEventBySlug(@Param('slug') slug: string) {
    return this.bayseService.getEventBySlug(slug);
  }

  /**
   * Get real-time ticker for a market
   * Replaces: GET /bayse/assets/:symbol/history
   */
  @Get('markets/:marketId/ticker')
  @ApiOperation({ summary: 'Get real-time ticker for a market outcome' })
  @ApiParam({ name: 'marketId', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @ApiQuery({ name: 'outcome', required: false, enum: ['YES', 'NO'], example: 'YES' })
  @ApiResponse({ status: 200, description: 'Ticker data (price, volume, spread)' })
  async getMarketTicker(
    @Param('marketId') marketId: string,
    @Query('outcome') outcome: 'YES' | 'NO' = 'YES',
  ) {
    return this.bayseService.getMarketTicker(marketId, outcome);
  }

  /**
   * Get trending events
   * Replaces: GET /bayse/market/trends
   */
  @Get('market/trends')
  @ApiOperation({ summary: 'Get trending prediction market events' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Trending events' })
  async getTrendingEvents(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.bayseService.getTrendingEvents(limit);
  }

  /**
   * Get authenticated user's portfolio positions
   * Replaces: POST /bayse/portfolio/values
   */
  @Get('portfolio')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the user's prediction market portfolio" })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Portfolio positions and summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPortfolio(
    @Query('page', new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ) {
    return this.bayseService.getPortfolio({ page, size });
  }

  /**
   * Get wallet balances
   * Replaces: POST /bayse/assets/batch  (balance info only)
   */
  @Get('wallet')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the user's wallet balances (USD, NGN)" })
  @ApiResponse({ status: 200, description: 'Wallet assets and balances' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWalletAssets() {
    return this.bayseService.getWalletAssets();
  }

  /**
   * Analyse portfolio risk
   * Replaces: POST /bayse/anomalies
   */
  @Get('portfolio/risk')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyse risk of current portfolio positions' })
  @ApiResponse({
    status: 200,
    description: 'Risk level, flags, and summary',
    schema: {
      example: {
        riskLevel: 'medium',
        flags: ['High concentration: AFCON 2026 (72.3% of portfolio)'],
        summary: '1 risk flag(s) detected across 3 position(s).',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analysePortfolioRisk() {
    return this.bayseService.analysePortfolioRisk();
  }
  @Get('debug')
async debug() {
  return {
    publicKey: this.bayseService['publicKey'],
    secretKey: this.bayseService['secretKey'] ? '***set***' : '***empty***',
    baseUrl: this.bayseService['baseUrl'],
  };
}
  /**
   * Health check
   */
  @Get('health')
  @ApiOperation({ summary: 'Bayse service health and cache status' })
  @ApiResponse({ status: 200, description: 'Service health' })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'Bayse Markets',
      cache: this.bayseService.getCacheStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear cache (admin/debug use)
   */
  @Delete('cache')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear the Bayse service cache' })
  async clearCache() {
    this.bayseService.clearCache();
    return { message: 'Cache cleared' };
  }
}