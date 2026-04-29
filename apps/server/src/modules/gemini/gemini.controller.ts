// src/gemini/gemini.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { JwtGuard } from '../../common/utils/jwt-strategy.utils';
import { PortfolioService } from '../portfolio/portfolio.service';

@Controller('risk')
export class GeminiController {
  constructor(
    private geminiService: GeminiService,
    private portfolioService: PortfolioService,
    private configService: ConfigService,
  ) {}

  @Post('analyze')
  @UseGuards(JwtGuard)
  async analyzePortfolioRisk(@Request() req, @Body() body: { portfolioId: string }) {
    // Get portfolio with live prices
    const portfolio = await this.portfolioService.getPortfolioWithLivePrices(
      body.portfolioId,
      req.user.id,
    );
    
    // Extract holdings data for Gemini
    const holdingsData = portfolio.holdings.map(h => ({
      symbol: h.symbol,
      quantity: h.quantity.toNumber(),
      currentPrice: h.currentPrice,
      change24h: h.percentageChange,
      value: h.currentValue,
    }));
    
    // Run AI risk analysis
    const riskAnalysis = await this.geminiService.analyzePortfolioRisk(
      holdingsData,
      portfolio.totalValue,
    );
    
    // Store snapshot in database (we'll add this next)
    // await this.riskSnapshotService.save(req.user.id, body.portfolioId, riskAnalysis);
    
    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      totalValue: portfolio.totalValue,
      ...riskAnalysis,
    };
  }
  @Post('test')
  async testGemini(@Headers('x-test-secret') secret: string) {
    const expected = this.configService.get<string>('RISK_TEST_SECRET');
    if (!expected) {
      throw new NotFoundException();
    }
    if (!secret || secret !== expected) {
      throw new ForbiddenException();
    }

    const testHoldings = [
      { symbol: 'TRUMP-2024-WIN', quantity: 100, currentPrice: 0.485, change24h: 0.012, value: 48.5 },
      { symbol: 'BTC-100K-EOY', quantity: 50, currentPrice: 0.23, change24h: -0.035, value: 11.5 },
    ];
    return this.geminiService.analyzePortfolioRisk(testHoldings, 60.0);
  }



  @Post('simulate')
  @UseGuards(JwtGuard)
  async simulateRiskChange(
    @Request() req,
    @Body() body: { portfolioId: string; symbol: string; newPrice: number },
  ) {
    const portfolio = await this.portfolioService.getPortfolioWithLivePrices(
      body.portfolioId,
      req.user.id,
    );
    
    const holdingsData = portfolio.holdings.map(h => ({
      symbol: h.symbol,
      quantity: h.quantity.toNumber(),
      currentPrice: h.currentPrice,
      change24h: h.percentageChange,
      value: h.currentValue,
    }));
    
    return this.geminiService.simulateRiskChange(holdingsData, {
      symbol: body.symbol.toUpperCase(),
      newPrice: body.newPrice,
    });
  }

  
}