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

  /**
   * Unauthenticated smoke test for Gemini wiring. Gated by a shared
   * RISK_TEST_SECRET header — when the env var is unset the route 404s.
   */
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

  /**
   * "What if" — re-score the portfolio with one holding's price replaced.
   * Takes a holdingId (not a bare symbol) so YES vs NO is unambiguous.
   */
  @Post('simulate')
  @UseGuards(JwtGuard)
  async simulateRiskChange(
    @Request() req,
    @Body() body: { holdingId: string; newPrice: number },
  ) {
    const holding = await this.portfolioService.findHoldingForUser(
      req.user.id,
      body.holdingId,
    );
    if (!holding) {
      throw new NotFoundException('Holding not found');
    }

    const portfolio = await this.portfolioService.getPortfolioWithLivePrices(
      holding.portfolioId,
      req.user.id,
    );

    const holdingsData = portfolio.holdings.map((h) => {
      const priceForSim =
        h.id === body.holdingId ? body.newPrice : (h.currentPrice ?? 0);
      return {
        symbol: h.eventTitle ?? h.symbol,
        quantity: h.quantity,
        currentPrice: priceForSim,
        change24h: h.pnlPercent ?? 0,
        value: priceForSim * h.quantity,
      };
    });

    return this.geminiService.simulateRiskChange(holdingsData, {
      symbol: holding.eventTitle ?? holding.symbol,
      newPrice: body.newPrice,
    });
  }
}
