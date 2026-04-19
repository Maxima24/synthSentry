// src/gemini/gemini.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { JwtGuard } from '../../common/utils/jwt-strategy.utils';
import { PortfolioService } from '../portfolio/portfolio.service';

@Controller('risk')
// @UseGuards(JwtGuard)
export class GeminiController {
  constructor(
    private geminiService: GeminiService,
    private portfolioService: PortfolioService,
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
  // Add to gemini.controller.ts temporarily
@Post('test')
async testGemini() {
  const testHoldings = [
    { symbol: 'AAPL', quantity: 10, currentPrice: 175.50, change24h: 1.2, value: 1755 },
    { symbol: 'TSLA', quantity: 5, currentPrice: 240.30, change24h: -3.5, value: 1201.50 },
  ];
  return this.geminiService.analyzePortfolioRisk(testHoldings, 2956.50);
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