import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BayseService, BaysePortfolioDto } from '../bayse/bayse.service';
import { GeminiService, HoldingData } from '../gemini/gemini.service';
import {
  EvaluateRiskDto,
  GetRiskHistoryDto,
  SetAlertThresholdDto,
  RiskLevel,
} from './dto/create-risk.dto';
import {
  RiskScoreDto,
  RiskSnapshotDto,
  AlertTriggeredDto,
  PortfolioRiskSummaryDto,
} from './dto/risk-response.dto';

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(
    private db: PrismaService,
    private bayse: BayseService,
    private gemini: GeminiService,
  ) {}

  // ── Core risk evaluation ─────────────────────────────────────────────────

  async evaluatePortfolioRisk(
    dto: EvaluateRiskDto,
    userId: string,
  ): Promise<RiskScoreDto> {
    const portfolioRecord = await this.db.portfolio.findFirst({
      where: { id: dto.portfolioId, userId },
    });

    if (!portfolioRecord) throw new NotFoundException('Portfolio not found');

    if (!dto.forceRefresh) {
      const recent = await this.db.riskSnapShots.findFirst({
        where: { portfolioId: dto.portfolioId },
        orderBy: { snapShotAt: 'desc' },
      });

      if (recent) {
        const age = Date.now() - new Date(recent.snapShotAt).getTime();
        if (age < this.CACHE_TTL) return this.formatRiskScore(recent);
      }
    }

    const baysePortfolio = await this.bayse.getPortfolio({ size: 100 });

    if (baysePortfolio.positions.length === 0) {
      throw new BadRequestException('No open positions found on Bayse to evaluate');
    }

    const holdingsData = await this.buildHoldingsData(baysePortfolio);
    const totalValue = baysePortfolio.totalCurrentValue;

    const [geminiAnalysis, bayseRisk] = await Promise.all([
      this.gemini.analyzePortfolioRisk(holdingsData, totalValue),
      this.bayse.analysePortfolioRisk(),
    ]);

    const mergedAnomalies = [
      ...geminiAnalysis.anomalies,
      ...bayseRisk.flags,
    ];

    const snapshot = await this.db.riskSnapShots.create({
      data: {
        portfolioId: dto.portfolioId,
        overallScore: geminiAnalysis.overallScore,
        explanation: geminiAnalysis.explanation,
        holdingScores: geminiAnalysis.perAssetScores.reduce(
          (acc, s) => ({ ...acc, [s.symbol]: s.score }),
          {} as Record<string, number>,
        ),
      },
    });

    await this.storeAnomalyFlags(dto.portfolioId, mergedAnomalies);
    await this.checkAndTriggerAlerts(dto.portfolioId, geminiAnalysis.overallScore);

    return this.formatRiskScore(snapshot);
  }

  // ── Risk history ─────────────────────────────────────────────────────────

  async getRiskHistory(
    dto: GetRiskHistoryDto,
    userId: string,
  ): Promise<RiskSnapshotDto[]> {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: dto.portfolioId, userId },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const snapshots = await this.db.riskSnapShots.findMany({
      where: { portfolioId: dto.portfolioId },
      orderBy: { snapShotAt: 'desc' },
      take: dto.limit || 10,
    });

    return snapshots.map(s => ({
      id: s.id,
      overallScore: s.overallScore,
      riskLevel: this.getRiskLevel(s.overallScore), // ← fixed: was missing
      explanation: s.explanation,
      holdingScores: s.holdingScores as Record<string, number>,
      snapShotAt: s.snapShotAt.toISOString(),
    }));
  }

  // ── Dashboard summary ────────────────────────────────────────────────────

  async getPortfolioRiskSummary(
    portfolioId: string,
    userId: string,
  ): Promise<PortfolioRiskSummaryDto> {
    const portfolioRecord = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        snapshots: { orderBy: { snapShotAt: 'desc' }, take: 1 },
      },
    });

    if (!portfolioRecord) throw new NotFoundException('Portfolio not found');

    const [baysePortfolio, walletAssets, alerts, anomalies] = await Promise.all([
      this.bayse.getPortfolio({ size: 100 }),
      this.bayse.getWalletAssets(),
      this.db.alertConfig.findMany({
        where: { holdings: { portfolioId } },
        include: { holdings: true },
      }),
      this.db.anomalyFlag.findMany({
        where: { holdings: { portfolio: { id: portfolioId } }, resolved: false },
        include: { holdings: true },
      }),
    ]);

    const latestSnapshot = portfolioRecord.snapshots[0];
    const riskScore = latestSnapshot
      ? this.formatRiskScore(latestSnapshot)
      : this.emptyRiskScore();

    return {
      portfolio: {
        id: portfolioRecord.id,
        name: portfolioRecord.name,
        totalValue: baysePortfolio.totalCurrentValue,
        totalCost: baysePortfolio.totalCost,
        totalPercentageChange: baysePortfolio.totalPercentageChange,
        walletUsd: walletAssets.totalUsd,
        walletNgn: walletAssets.totalNgn,
        openPositions: baysePortfolio.positions.length,
      },
      risk: riskScore,
      alerts: alerts.map(a => ({
        id: a.id,
        label: a.holdings.symbol,
        threshold: a.threshold,
        triggered: a.triggeredAt !== null,
        triggeredAt: a.triggeredAt?.toISOString(),
        // ← fixed: removed stray symbol field
      })),
      activeAnomalies: anomalies.map(a => ({
        label: a.holdings.symbol,
        reason: a.reason,
        severity: 'medium' as const,
        // ← fixed: removed stray symbol field
      })),
    };
  }

  // ── Alerts ───────────────────────────────────────────────────────────────

  async setAlertThreshold(
    holdingId: string,
    dto: SetAlertThresholdDto,
    userId: string,
  ) {
    const holding = await this.db.holdings.findFirst({
      where: { id: holdingId, portfolio: { userId } },
    });

    if (!holding) throw new NotFoundException('Holding not found');

    const alert = await this.db.alertConfig.upsert({
      where: { id: holdingId },
      update: {
        threshold: dto.threshold,
        reason: dto.reason || `Alert threshold set to ${dto.threshold}`,
      },
      create: {
        holdingId,
        threshold: dto.threshold,
        reason: dto.reason || `Alert threshold set to ${dto.threshold}`,
      },
    });

    return {
      id: alert.id,
      label: holding.symbol,
      threshold: alert.threshold,
      reason: alert.reason,
      createdAt: alert.createdAt.toISOString(),
    };
  }

  async getAlerts(userId: string) {
    const alerts = await this.db.alertConfig.findMany({
      where: { holdings: { portfolio: { userId } } },
      include: { holdings: true },
    });

    return alerts.map(a => ({
      id: a.id,
      label: a.holdings.symbol,
      threshold: a.threshold,
      reason: a.reason,
      triggered: a.triggeredAt !== null,
      triggeredAt: a.triggeredAt?.toISOString(),
    }));
  }

  async detectAndStoreAnomalies(portfolioId: string): Promise<AlertTriggeredDto[]> {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId },
      include: { holdings: true },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const bayseRisk = await this.bayse.analysePortfolioRisk();
    const triggeredAlerts: AlertTriggeredDto[] = [];

    if (bayseRisk.flags.length === 0) return [];

    for (const flag of bayseRisk.flags) {
      const holding = portfolio.holdings[0];
      if (!holding) continue;

      await this.db.anomalyFlag.create({
        data: { holdingId: holding.id, reason: flag },
      });

      const alert = await this.db.alertConfig.findFirst({
        where: { holdingId: holding.id, triggeredAt: null },
      });

      if (alert) {
        await this.db.alertConfig.update({
          where: { id: alert.id },
          data: { triggeredAt: new Date() },
        });

        triggeredAlerts.push({
          alertId: alert.id,
          label: holding.symbol, // ← fixed: was symbol: holding.symbol
          currentScore: 0,
          threshold: alert.threshold,
          message: flag,
          triggeredAt: new Date().toISOString(),
        });

        this.logger.log(`Alert triggered: ${flag}`);
      }
    }

    return triggeredAlerts;
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async buildHoldingsData(
    portfolio: BaysePortfolioDto,
  ): Promise<HoldingData[]> {
    return Promise.all(
      portfolio.positions.map(async (pos) => {
        let change24h = 0;
        try {
          const ticker = await this.bayse.getMarketTicker(pos.id, pos.outcome);
          change24h = ticker.priceChange24h;
        } catch {
          // ticker is best-effort — don't block the analysis
        }

        return {
          symbol: this.shortLabel(pos.eventTitle),
          quantity: pos.shares,
          currentPrice: pos.averagePrice,
          change24h,
          value: pos.currentValue,
        } satisfies HoldingData;
      }),
    );
  }

  private async storeAnomalyFlags(
    portfolioId: string,
    anomalies: string[],
  ): Promise<void> {
    if (anomalies.length === 0) return;

    const firstHolding = await this.db.holdings.findFirst({
      where: { portfolioId },
    });

    if (!firstHolding) return;

    await this.db.anomalyFlag.createMany({
      data: anomalies.map(reason => ({ holdingId: firstHolding.id, reason })),
      skipDuplicates: true,
    });
  }

  private async checkAndTriggerAlerts(
    portfolioId: string,
    currentScore: number,
  ): Promise<void> {
    const alerts = await this.db.alertConfig.findMany({
      where: { holdings: { portfolioId }, triggeredAt: null },
    });

    for (const alert of alerts) {
      if (currentScore >= alert.threshold) {
        await this.db.alertConfig.update({
          where: { id: alert.id },
          data: { triggeredAt: new Date() },
        });
        this.logger.log(`Alert fired: score ${currentScore} >= threshold ${alert.threshold}`);
      }
    }
  }

  private formatRiskScore(snapshot: any): RiskScoreDto {
    const perAssetScores = Object.entries(
      snapshot.holdingScores as Record<string, number>,
    ).map(([symbol, score]) => ({
      symbol,
      score,
      riskLevel: this.getRiskLevel(score),
      riskFactors: [],
    }));

    return {
      overallScore: snapshot.overallScore,
      riskLevel: this.getRiskLevel(snapshot.overallScore),
      explanation: snapshot.explanation,
      reasoningPath: [],
      anomalies: [],
      perAssetScores,
      evaluatedAt: snapshot.snapShotAt.toISOString(),
    };
  }

  private emptyRiskScore(): RiskScoreDto {
    return {
      overallScore: 0,
      riskLevel: RiskLevel.LOW,
      explanation: 'No risk evaluation yet. Trigger an evaluation to get started.',
      reasoningPath: [],
      anomalies: [],
      perAssetScores: [],
      evaluatedAt: new Date().toISOString(),
    };
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score < 25) return RiskLevel.LOW;
    if (score < 50) return RiskLevel.MEDIUM;
    if (score < 75) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  private shortLabel(title: string): string {
    return title.length > 30 ? title.slice(0, 27) + '...' : title;
  }
}