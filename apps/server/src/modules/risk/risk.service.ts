import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BayseService } from '../bayse/bayse.service';
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
import { Prisma } from "@prisma/client";
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
    // 1. confirm portfolio belongs to user
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: dto.portfolioId, userId },
      include: { holdings: true },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    if (portfolio.holdings.length === 0) {
      throw new BadRequestException(
        'Portfolio has no holdings. Add assets before evaluating risk.',
      );
    }

    // 2. return cached snapshot if fresh enough
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

    // 3. enrich db holdings with live Bayse market data
    const holdingsData = await this.buildHoldingsFromDb(portfolio.holdings);
    const totalValue = holdingsData.reduce((sum, h) => sum + h.value, 0);

    if (totalValue === 0) {
      throw new BadRequestException(
        'Could not compute portfolio value. Check that your holdings have valid symbols.',
      );
    }

    // 4. run Gemini analysis
    const geminiAnalysis = await this.gemini.analyzePortfolioRisk(
      holdingsData,
      totalValue,
    );

    // 5. optionally merge Bayse risk flags if available
    let mergedAnomalies = [...geminiAnalysis.anomalies];
    try {
      const bayseRisk = await this.bayse.analysePortfolioRisk();
      mergedAnomalies = [...mergedAnomalies, ...bayseRisk.flags];
    } catch {
      this.logger.warn('Bayse risk analysis unavailable — using Gemini anomalies only');
    }

    // 6. persist snapshot
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

    // 7. store anomalies and check alert thresholds
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

    return snapshots.map((s) => ({
      id: s.id,
      overallScore: s.overallScore,
      riskLevel: this.getRiskLevel(s.overallScore),
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
        holdings: true,
        snapshots: { orderBy: { snapShotAt: 'desc' }, take: 1 },
      },
    });

    if (!portfolioRecord) throw new NotFoundException('Portfolio not found');

    const holdingsData = await this.buildHoldingsFromDb(portfolioRecord.holdings);
    const totalValue = holdingsData.reduce((sum, h) => sum + h.value, 0);

    // wallet assets are best-effort
    let walletUsd = 0;
    let walletNgn = 0;
    try {
      const walletAssets = await this.bayse.getWalletAssets();
      walletUsd = walletAssets.totalUsd;
      walletNgn = walletAssets.totalNgn;
    } catch {
      this.logger.warn('Could not fetch wallet assets from Bayse');
    }

    const [alerts, anomalies] = await Promise.all([
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
        totalValue,
        totalCost: 0,
        totalPercentageChange: 0,
        walletUsd,
        walletNgn,
        openPositions: portfolioRecord.holdings.length,
      },
      risk: riskScore,
      alerts: alerts.map((a) => ({
        id: a.id,
        label: a.holdings.symbol,
        threshold: a.threshold,
        triggered: a.triggeredAt !== null,
        triggeredAt: a.triggeredAt?.toISOString(),
      })),
      activeAnomalies: anomalies.map((a) => ({
        label: a.holdings.symbol,
        reason: a.reason,
        severity: 'medium' as const,
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

    return alerts.map((a) => ({
      id: a.id,
      label: a.holdings.symbol,
      threshold: a.threshold,
      reason: a.reason,
      triggered: a.triggeredAt !== null,
      triggeredAt: a.triggeredAt?.toISOString(),
    }));
  }

  async detectAndStoreAnomalies(
    portfolioId: string,
  ): Promise<AlertTriggeredDto[]> {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId },
      include: { holdings: true },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const triggeredAlerts: AlertTriggeredDto[] = [];

    let flags: string[] = [];
    try {
      const bayseRisk = await this.bayse.analysePortfolioRisk();
      flags = bayseRisk.flags;
    } catch {
      this.logger.warn('Bayse anomaly detection unavailable');
      return [];
    }

    if (flags.length === 0) return [];

    for (const flag of flags) {
      // attach anomaly to first holding as a portfolio-level flag
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
          label: holding.symbol,
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

  private async buildHoldingsFromDb(
  holdings: Array<{
    id: string;
    symbol: string;
    quantity: Prisma.Decimal;
    outcome: "YES" | 'NO';
    marketId: string | null;
  }>,
): Promise<HoldingData[]> {
  return Promise.all(
    holdings.map(async (holding) => {
      let currentPrice = 0;
      let change24h = 0;

      try {
        const ticker = await this.bayse.getMarketTicker(
          holding.symbol,
          holding.outcome ?? 'YES',
        );
        // fix field name to whatever BayseTickerDto actually has
       currentPrice = ticker.lastPrice;
change24h = ticker.priceChange24h;
      } catch {
        this.logger.warn(
          `Could not fetch Bayse ticker for ${holding.symbol} — defaulting to 0`,
        );
      }

      const qty = holding.quantity.toNumber(); // Decimal → number

      return {
        symbol: holding.symbol,
        quantity: qty,
        currentPrice,
        change24h,
        value: qty * currentPrice,
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
      data: anomalies.map((reason) => ({ holdingId: firstHolding.id, reason })),
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
        this.logger.log(
          `Alert fired: score ${currentScore} >= threshold ${alert.threshold}`,
        );
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
      explanation:
        'No risk evaluation yet. Trigger an evaluation to get started.',
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
}