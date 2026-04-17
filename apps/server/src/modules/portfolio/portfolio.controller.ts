// src/portfolio/portfolio.controller.ts
import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtGuard } from 'src/common/utils/jwt-strategy.utils';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddHoldingDto } from './dto/add-holding.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('portfolio')
@Controller('portfolio')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  /**
   * Create a new portfolio
   * PRD: Portfolio Builder - user creates portfolio
   */

  @UseGuards(JwtGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiBody({ type: CreatePortfolioDto })
  
  @ApiResponse({
    status: 201,
    description: 'Portfolio created successfully',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'My Investment Portfolio',
        userId: 'user123',
        createdAt: '2025-04-17T12:00:00Z',
        updatedAt: '2025-04-17T12:00:00Z',
      },
    },
  })
  createPortfolio(@CurrentUser() user, @Body() dto: CreatePortfolioDto) {
    console.log(user,"This is the current user")
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
          name: 'My Investment Portfolio',
          userId: 'user123',
          holdings: [
            { id: 'h1', symbol: 'BTC', quantity: 2.5 },
            { id: 'h2', symbol: 'ETH', quantity: 10 },
          ],
          createdAt: '2025-04-17T12:00:00Z',
          updatedAt: '2025-04-17T12:00:00Z',
        },
      ],
    },
  })
  getUserPortfolios(@Request() req) {
    return this.portfolioService.getUserPortfolios(req.user.id);
  }

  /**
   * Get a specific portfolio with live prices
   * PRD: Live Market Dashboard - real-time price feed
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio with live market prices' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Portfolio ID' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio with live prices',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'My Investment Portfolio',
        userId: 'user123',
        holdings: [
          {
            id: 'h1',
            symbol: 'BTC',
            quantity: 2.5,
            currentPrice: 67500.5,
            change24h: 2.5,
            value: 168751.25,
          },
          {
            id: 'h2',
            symbol: 'ETH',
            quantity: 10,
            currentPrice: 3250.0,
            change24h: -1.2,
            value: 32500.0,
          },
        ],
        totalValue: 201251.25,
        lastUpdated: '2025-04-17T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  getPortfolio(@Request() req, @Param('id') id: string) {
    return this.portfolioService.getPortfolioWithLivePrices(id, req.user.id);
  }

  /**
   * Add a holding to a portfolio
   * PRD: Portfolio Builder - add assets with live price verification
   */
  @Post(':id/holdings')
  @ApiOperation({ summary: 'Add a holding to a portfolio' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Portfolio ID' })
  @ApiBody({ type: AddHoldingDto })
  @ApiResponse({
    status: 201,
    description: 'Holding added successfully',
    schema: {
      example: {
        id: 'h1',
        portfolioId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        symbol: 'BTC',
        quantity: 2.5,
        createdAt: '2025-04-17T12:00:00Z',
        updatedAt: '2025-04-17T12:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 503, description: 'Bayse API unavailable - asset verification failed' })
  addHolding(@Request() req, @Param('id') portfolioId: string, @Body() dto: AddHoldingDto) {
    return this.portfolioService.addHolding(req.user.id, portfolioId, dto);
  }

  /**
   * Remove a holding from a portfolio
   */
  @Delete('holdings/:holdingId')
  @ApiOperation({ summary: 'Remove a holding from a portfolio' })
  @ApiParam({ name: 'holdingId', example: 'h1', description: 'Holding ID' })
  @ApiResponse({
    status: 200,
    description: 'Holding removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Holding not found' })
  removeHolding(@Request() req, @Param('holdingId') holdingId: string) {
    return this.portfolioService.removeHolding(req.user.id, holdingId);
  }
}