import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BayseService } from '../bayse/bayse.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AddHoldingDto } from './dto/add-holding.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';

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

  /**
   * Add a holding — now stores a Bayse event/market ID instead of a stock symbol.
   * dto.symbol should be a Bayse eventId or marketId.
   * We verify it exists on Bayse before storing.
   */
  async addHolding(userId: string, portfolioId: string, dto: AddHoldingDto) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Verify the event exists on Bayse before storing
    // dto.symbol now holds a Bayse eventId
    const event = await this.bayse.getEvent(dto.symbol).catch(() => null);
    if (!event) {
      throw new BadRequestException(
        `Bayse event '${dto.symbol}' not found. Provide a valid eventId.`,
      );
    }

    // Store eventId as symbol + event title as a label for display
    return this.db.holdings.upsert({
      where: {
        symbol_portfolioId: {
          symbol: dto.symbol,
          portfolioId,
        },
      },
      update: {
        quantity: { increment: dto.quantity },
      },
      create: {
        portfolioId,
        symbol: dto.symbol,           // Bayse eventId
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

  /**
   * Get portfolio enriched with live Bayse data.
   * Replaces the old getMultipleAssets() call — now pulls the full
   * Bayse PM portfolio and wallet alongside the DB holdings.
   */
  async getPortfolioWithLivePrices(portfolioId: string, userId: string) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: { holdings: true },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Fetch live PM portfolio + wallet in parallel
    const [baysePortfolio, walletAssets] = await Promise.all([
      this.bayse.getPortfolio({ size: 100 }),
      this.bayse.getWalletAssets(),
    ]);

    // Match DB holdings to live Bayse positions by eventId (stored in symbol)
    // Bayse positions are keyed by market/event; we match on event title or id
    const holdingsWithValue = portfolio.holdings.map((holding) => {
      // Find matching live position — symbol stores the Bayse eventId
      const livePosition = baysePortfolio.positions.find((pos) =>
        pos.eventTitle.includes(holding.symbol) || holding.symbol.includes(pos.id ?? ''),
      );

      return {
        ...holding,
        eventTitle: livePosition?.eventTitle ?? holding.symbol,
        outcome: livePosition?.outcome ?? null,
        currentPrice: livePosition?.averagePrice ?? 0,     // implied probability
        currentValue: livePosition?.currentValue ?? 0,
        percentageChange: livePosition?.percentageChange ?? 0,
        payoutIfWins: livePosition?.payoutIfWins ?? 0,
        isLive: !!livePosition,
      };
    });

    const totalValue = baysePortfolio.totalCurrentValue;

    return {
      id: portfolio.id,
      name: portfolio.name,
      userId: portfolio.userId,
      holdings: holdingsWithValue,
      totalValue,
      totalCost: baysePortfolio.totalCost,
      totalPercentageChange: baysePortfolio.totalPercentageChange,
      wallet: {
        usd: walletAssets.totalUsd,
        ngn: walletAssets.totalNgn,
      },
      openPositions: baysePortfolio.positions.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Search for events to add as holdings.
   * Replaces the old asset search — now searches Bayse prediction market events.
   */
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

    // Return a slim shape useful for the "add holding" UI
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