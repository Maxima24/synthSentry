import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BayseService } from '../bayse/bayse.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddHoldingDto } from './dto/add-holding.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';
import { Outcome } from '@prisma/client';

@Injectable()
export class PortfolioService {
  constructor(
    private logger: LoggerService,
    private db: PrismaService,
    private bayse: BayseService,
  ) {}

  async createPortfolio(userId: string, name?: string) {
    if (!userId) {
      this.logger.warn('UserId not found', 'CreatePortfolio', { name });
    }

    return this.db.portfolio.create({
      data: {
        name: name || 'My Portfolio',
        userId,
      },
    });
  }

  async getUserPortfolios(userId: string) {
    return this.db.portfolio.findMany({
      where: { userId },
      include: { holdings: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addHolding(userId: string, portfolioId: string, dto: AddHoldingDto) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Verify the event exists on Bayse and grab its marketId + outcome
    const event = await this.bayse.getEvent(dto.symbol).catch(() => null);
    if (!event) {
      throw new BadRequestException(
        `Bayse event '${dto.symbol}' not found. Provide a valid eventId.`,
      );
    }

    // Pull the first market from the event to get marketId and outcome
    // so getMarketTicker works correctly during risk evaluation
    const marketId = event.markets?.[0]?.id ?? null;
    const outcome = event.markets?.[0]?.outcome ?? 'YES';
    const eventTitle = event.title ?? dto.symbol;

    return this.db.holdings.upsert({
      where: {
        symbol_portfolioId: {
          symbol: dto.symbol,
          portfolioId,
        },
      },
      update: {
        quantity: { increment: dto.quantity },
        marketId,
        outcome,
        eventTitle,
      },
      create: {
        portfolioId,
        symbol: dto.symbol,     // Bayse eventId
        marketId,               // used by getMarketTicker
        outcome,                // YES | NO
        eventTitle,             // display label
        quantity: dto.quantity,
      },
    });
  }

  async removeHolding(userId: string, holdingId: string) {
    const holding = await this.db.holdings.findFirst({
      where: {
        id: holdingId,
        portfolio: {
          is: {
            user: { is: { id: userId } },
          },
        },
      },
    });

    if (!holding) throw new NotFoundException('Holding not found');

    return this.db.holdings.delete({ where: { id: holdingId } });
  }

  async getPortfolioWithLivePrices(portfolioId: string, userId: string) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: { holdings: true },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // enrich each holding with live ticker data using stored marketId
    const holdingsWithValue = await Promise.all(
      portfolio.holdings.map(async (holding) => {
        let currentPrice = 0;
        let change24h = 0;

        if (holding.marketId) {
          try {
            const ticker = await this.bayse.getMarketTicker(
              holding.marketId,
              holding.outcome ?? 'YES',
            );
            currentPrice = ticker.lastPrice;
            change24h = ticker.priceChange24h;
          } catch {
            this.logger.warn(
              `Ticker fetch failed for marketId ${holding.marketId}`,
              'PortfolioService',
            );
          }
        }

        const qty = Number(holding.quantity);

        return {
          ...holding,
          eventTitle: holding.eventTitle ?? holding.symbol,
          currentPrice,
          change24h,
          currentValue: qty * currentPrice,
          isLive: currentPrice > 0,
        };
      }),
    );

    const totalValue = holdingsWithValue.reduce((sum, h) => sum + h.currentValue, 0);

    // wallet is best-effort
    let walletUsd = 0;
    let walletNgn = 0;
    try {
      const walletAssets = await this.bayse.getWalletAssets();
      walletUsd = walletAssets.totalUsd;
      walletNgn = walletAssets.totalNgn;
    } catch {
      this.logger.warn('Could not fetch wallet assets', 'PortfolioService');
    }

    return {
      id: portfolio.id,
      name: portfolio.name,
      userId: portfolio.userId,
      holdings: holdingsWithValue,
      totalValue,
      wallet: {
        usd: walletUsd,
        ngn: walletNgn,
      },
      openPositions: portfolio.holdings.length,
      lastUpdated: new Date(),
    };
  }

  async searchEvents(keyword: string, category?: string) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const { events } = await this.bayse.listEvents({
      keyword,
      category,
      status: 'open',
      size: 20,
    });

    return events.map((e) => ({
      eventId: e.id,
      slug: e.slug,
      title: e.title,
      category: e.category,
      yesPrice: e.yesPrice,
      noPrice: e.noPrice,
      impliedProbability: e.impliedProbability,
      liquidity: e.liquidity,
      totalVolume: e.totalVolume,
      resolutionDate: e.resolutionDate,
      status: e.status,
    }));
  }
}