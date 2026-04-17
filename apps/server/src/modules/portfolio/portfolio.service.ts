// src/portfolio/portfolio.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { BayseService } from '../bayse/bayse.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto'
import { AddHoldingDto } from './dto/add-holding.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';


@Injectable()
export class PortfolioService {
  constructor(
    private logger:LoggerService,
    private db: PrismaService,
    private bayse: BayseService,
  ) {}

  async createPortfolio(userId: string, name?: string) {
    if(!userId){
      this.logger.warn("UserId not founf","CreatePortfolio",{
        name
      })
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
    // Verify portfolio belongs to user
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });
    
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Verify asset exists on Bayse
    await this.bayse.getAssetPrice(dto.symbol);

    return this.db.holdings.upsert({
      where: {
        symbol_portfolioId:{
          symbol:dto.symbol.toUpperCase(),
          portfolioId
        }
      },
      update: {
        quantity: { increment: dto.quantity },
      },
      create: {
        portfolioId,
        symbol: dto.symbol.toUpperCase(),
        quantity: dto.quantity,
      },
    });
  }

  async removeHolding(userId: string, holdingId: string) {
    const holdings = await this.db.holdings.findFirst({
      where: {
        id: holdingId,
        portfolio: {
          is: {
            user:{
              is:{
                id:userId
              }
            }
          }
      },
    }});
    
    if (!holdings) throw new NotFoundException('Holding not found');
    
    return this.db.holdings.delete({ where: { id: holdingId } });
  }

  async getPortfolioWithLivePrices(portfolioId: string, userId: string) {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: { holdings: true },
    });
    
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Fetch live prices for all holdings
    const symbols = portfolio.holdings.map(h => h.symbol);
    const livePrices = await this.bayse.getMultipleAssets(symbols);

    // Calculate total value
    const holdingsWithValue = portfolio.holdings.map(holdings => {
      const priceData = livePrices.find(p => p.symbol === holdings.symbol);
      const currentPrice = priceData?.price || 0;
      const value = currentPrice * holdings.quantity.toNumber();
      
      return {
        ...holdings,
        currentPrice,
        change24h: priceData?.change24h || 0,
        value,
      };
    });

    const totalValue = holdingsWithValue.reduce((sum, h) => sum + h.value, 0);

    return {
      ...portfolio,
      holdings: holdingsWithValue,
      totalValue,
      lastUpdated: new Date(),
    };
  }
}