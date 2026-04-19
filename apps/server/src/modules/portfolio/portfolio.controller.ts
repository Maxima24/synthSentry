import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtGuard } from 'src/common/utils/jwt-strategy.utils';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddHoldingDto } from './dto/add-holding.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('portfolio')
@Controller('portfolio')
@UseGuards(JwtGuard)  // once at class level — removed all duplicates
@ApiBearerAuth()
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  /**
   * Create a new portfolio
   */
  @Post()
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiBody({ type: CreatePortfolioDto })
  @ApiResponse({
    status: 201,
    description: 'Portfolio created successfully',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'My Prediction Portfolio',
        userId: 'user123',
        createdAt: '2026-04-19T12:00:00Z',
        updatedAt: '2026-04-19T12:00:00Z',
      },
    },
  })
  createPortfolio(@CurrentUser() user, @Body() dto: CreatePortfolioDto) {
    return this.portfolioService.createPortfolio(user.id, dto.name);
  }

  /**
   * Get all portfolios for the authenticated user
   */
  @Get()
  @ApiOperation({ summary: 'Get all portfolios for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of user portfolios',
    schema: {
      example: [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'My Prediction Portfolio',
          userId: 'user123',
          holdings: [
            { id: 'h1', symbol: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', quantity: 50 },
          ],
          createdAt: '2026-04-19T12:00:00Z',
          updatedAt: '2026-04-19T12:00:00Z',
        },
      ],
    },
  })
  getUserPortfolios(@Request() req) {
    return this.portfolioService.getUserPortfolios(req.user.id);
  }

  /**
   * Search Bayse prediction market events to add as holdings
   * PRD: Portfolio Builder - event discovery
   */
  @Get('search')
  @ApiOperation({ summary: 'Search Bayse prediction market events' })
  @ApiQuery({ name: 'keyword', required: true,  example: 'bitcoin' })
  @ApiQuery({ name: 'category', required: false, example: 'crypto', description: 'crypto | sports | politics' })
  @ApiResponse({
    status: 200,
    description: 'Matching open events',
    schema: {
      example: [
        {
          eventId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          slug: 'btc-above-100k-june-2026',
          title: 'Will BTC be above $100k by June 2026?',
          category: 'crypto',
          yesPrice: 0.62,
          noPrice: 0.38,
          impliedProbability: 62,
          liquidity: 85000,
          totalVolume: 210000,
          resolutionDate: '2026-06-30T00:00:00Z',
          status: 'open',
        },
      ],
    },
  })
  searchEvents(
    @Query('keyword') keyword: string,
    @Query('category') category?: string,
  ) {
    return this.portfolioService.searchEvents(keyword, category);
  }

  /**
   * Get a specific portfolio with live Bayse market data
   * PRD: Live Market Dashboard
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio with live Bayse market data' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio with live prediction market prices',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'My Prediction Portfolio',
        userId: 'user123',
        holdings: [
          {
            id: 'h1',
            symbol: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            eventTitle: 'Will BTC be above $100k by June 2026?',
            outcome: 'YES',
            quantity: 50,
            currentPrice: 0.62,
            currentValue: 31.0,
            percentageChange: 7.6,
            payoutIfWins: 50.0,
            isLive: true,
          },
        ],
        totalValue: 31.0,
        totalCost: 28.8,
        totalPercentageChange: 7.6,
        wallet: { usd: 1250.5, ngn: 50000 },
        openPositions: 1,
        lastUpdated: '2026-04-19T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  getPortfolio(@Request() req, @Param('id') id: string) {
    return this.portfolioService.getPortfolioWithLivePrices(id, req.user.id);
  }

  /**
   * Add a Bayse prediction market event as a holding
   * PRD: Portfolio Builder — dto.symbol should be a Bayse eventId
   */
  @Post(':id/holdings')
  @ApiOperation({ summary: 'Add a Bayse event as a holding' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Portfolio ID' })
  @ApiBody({ type: AddHoldingDto })
  @ApiResponse({
    status: 201,
    description: 'Holding added successfully',
    schema: {
      example: {
        id: 'h1',
        portfolioId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        symbol: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // Bayse eventId
        quantity: 50,
        createdAt: '2026-04-19T12:00:00Z',
        updatedAt: '2026-04-19T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bayse event not found — invalid eventId' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  addHolding(
    @Request() req,
    @Param('id') portfolioId: string,
    @Body() dto: AddHoldingDto,
  ) {
    return this.portfolioService.addHolding(req.user.id, portfolioId, dto);
  }

  /**
   * Remove a holding from a portfolio
   */
  @Delete('holdings/:holdingId')
  @ApiOperation({ summary: 'Remove a holding from a portfolio' })
  @ApiParam({ name: 'holdingId', example: 'h1' })
  @ApiResponse({ status: 200, description: 'Holding removed successfully' })
  @ApiResponse({ status: 404, description: 'Holding not found' })
  removeHolding(@Request() req, @Param('holdingId') holdingId: string) {
    return this.portfolioService.removeHolding(req.user.id, holdingId);
  }
}