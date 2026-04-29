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

  async deletePortfolio(userId: string, portfolioId: string) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Holdings cascade via the schema's onDelete: Cascade
    return this.db.portfolio.delete({ where: { id: portfolioId } });
  }

  async findHoldingForUser(userId: string, holdingId: string) {
    return this.db.holdings.findFirst({
      where: {
        id: holdingId,
        portfolio: { userId },
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
   * Paper-trading mark-to-market: prices each DB holding against the
   * current Bayse implied probability (cached). One slow event can't hang
   * the whole render — failed lookups produce a stale-marked holding.
   */
  async getPortfolioWithLivePrices(portfolioId: string, userId: string) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: { holdings: true },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const priced = await Promise.all(
      portfolio.holdings.map(async (h) => {
        const event = await this.bayse
          .getEventCached(h.symbol)
          .catch(() => null);

        const entryPrice = Number(h.entryPrice);
        const quantity = Number(h.quantity);
        const costBasis = entryPrice * quantity;

        if (!event) {
          return {
            id: h.id,
            symbol: h.symbol,
            eventTitle: h.eventTitle,
            outcome: h.outcome,
            quantity,
            entryPrice,
            currentPrice: null as number | null,
            currentValue: null as number | null,
            costBasis,
            pnl: null as number | null,
            pnlPercent: null as number | null,
            payoutIfWins: quantity,
            isLive: false,
            isStale: true,
          };
        }

        const currentPrice =
          h.outcome === 'YES' ? event.yesPrice : event.noPrice;
        const currentValue = currentPrice * quantity;
        const pnl = currentValue - costBasis;
        const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

        return {
          id: h.id,
          symbol: h.symbol,
          eventTitle: h.eventTitle,
          outcome: h.outcome,
          quantity,
          entryPrice,
          currentPrice,
          currentValue,
          costBasis,
          pnl,
          pnlPercent,
          payoutIfWins: quantity,
          isLive: event.status === 'open',
          isStale: false,
        };
      }),
    );

    const totalValue = priced.reduce((s, h) => s + (h.currentValue ?? 0), 0);
    const totalCost = priced.reduce((s, h) => s + h.costBasis, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return {
      id: portfolio.id,
      name: portfolio.name,
      userId: portfolio.userId,
      holdings: priced,
      totalValue,
      totalCost,
      totalPnl,
      totalPnlPercent,
      openPositions: priced.filter((h) => h.isLive).length,
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