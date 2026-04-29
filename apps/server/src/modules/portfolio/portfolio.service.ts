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
   * Paper-trading add: snapshots eventTitle, marketId and the current
   * implied probability for the chosen side at buy-time. Subsequent buys
   * of the same (event, outcome) weighted-average into the existing lot.
   */
  async addHolding(userId: string, portfolioId: string, dto: AddHoldingDto) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const event = await this.bayse.getEvent(dto.symbol).catch(() => null);
    if (!event) {
      throw new BadRequestException(
        `Bayse event '${dto.symbol}' not found. Provide a valid eventId.`,
      );
    }

    const priceNow = dto.outcome === 'YES' ? event.yesPrice : event.noPrice;
    const marketId = event.markets?.[0]?.id ?? event.id;

    const existing = await this.db.holdings.findUnique({
      where: {
        symbol_outcome_portfolioId: {
          symbol: dto.symbol,
          outcome: dto.outcome,
          portfolioId,
        },
      },
    });

    let newQty = dto.quantity;
    let newAvg = priceNow;
    if (existing) {
      const oldQty = Number(existing.quantity);
      const oldPrice = Number(existing.entryPrice);
      newQty = oldQty + dto.quantity;
      // weighted-avg new lot into existing position
      newAvg = (oldQty * oldPrice + dto.quantity * priceNow) / newQty;
    }

    return this.db.holdings.upsert({
      where: {
        symbol_outcome_portfolioId: {
          symbol: dto.symbol,
          outcome: dto.outcome,
          portfolioId,
        },
      },
      update: { quantity: newQty, entryPrice: newAvg },
      create: {
        portfolioId,
        symbol: dto.symbol,
        outcome: dto.outcome,
        eventTitle: event.title,
        marketId,
        entryPrice: priceNow,
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