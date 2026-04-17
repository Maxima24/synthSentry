import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BayseService } from '../bayse/bayse.service';
import { GeminiService, HoldingData, RiskAnalysisResult } from '../gemini/gemini.service';
import {
  EvaluateRiskDto,
  GetRiskHistoryDto,
  SetAlertThresholdDto,
  CreateRiskAlertDto,
} from './dto/create-risk.dto';
import { RiskLevel } from './dto/create-risk.dto';
import { RiskScoreDto, RiskSnapshotDto, AlertTriggeredDto, PortfolioRiskSummaryDto } from './dto/risk-response.dto';

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private db: PrismaService,
    private bayse: BayseService,
    private gemini: GeminiService,
  ) {}

  /**
   * Evaluate risk for a portfolio
   * PRD: AI Risk Score - Gemini generates 0-100 risk score
   */
  async evaluatePortfolioRisk(dto: EvaluateRiskDto, userId: string): Promise<RiskScoreDto> {
    // Verify portfolio ownership
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: dto.portfolioId, userId },
      include: { holdings: true },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    if (portfolio.holdings.length === 0) {
      throw new BadRequestException('Portfolio has no holdings to evaluate');
    }

    // Check cache unless force refresh
    if (!dto.forceRefresh) {
      const recentSnapshot = await this.db.riskSnapShots.findFirst({
        where: { portfolioId: dto.portfolioId },
        orderBy: { snapShotAt: 'desc' },
      });

      if (recentSnapshot) {
        const cacheAge = Date.now() - new Date(recentSnapshot.snapShotAt).getTime();
        if (cacheAge < this.CACHE_TTL) {
          return this.formatRiskScore(recentSnapshot);
        }
      }
    }

    // Fetch live prices
    const symbols = portfolio.holdings.map(h => h.symbol);
    const livePrices = await this.bayse.getMultipleAssets(symbols);
    const priceMap = new Map(livePrices.map(p => [p.symbol, p]));

    // Build holding data for Gemini
    const holdingsData: HoldingData[] = portfolio.holdings.map(h => {
      const priceData = priceMap.get(h.symbol);
      const currentPrice = priceData?.price || 0;
      const value = currentPrice * Number(h.quantity);

      return {
        symbol: h.symbol,
        quantity: Number(h.quantity),
        currentPrice,
        change24h: priceData?.change24h || 0,
        value,
      };
    });

    const totalValue = holdingsData.reduce((sum, h) => sum + h.value, 0);

    // Get Gemini risk analysis
    const analysis = await this.gemini.analyzePortfolioRisk(holdingsData, totalValue);

    // Save snapshot
    const snapshot = await this.db.riskSnapShots.create({
      data: {
        portfolioId: dto.portfolioId,
        overallScore: analysis.overallScore,
        explanation: analysis.explanation,
        holdingScores: analysis.perAssetScores.reduce((acc, s) => {
          acc[s.symbol] = s.score;
          return acc;
        }, {} as Record<string, number>),
      },
    });

    // Check for triggered alerts
    await this.checkAndTriggerAlerts(dto.portfolioId, analysis.overallScore);

    return this.formatRiskScore(snapshot);
  }

  /**
   * Get risk history for a portfolio
   * PRD: Risk History Chart (P1) - time-series of risk score
   */
  async getRiskHistory(dto: GetRiskHistoryDto, userId: string): Promise<RiskSnapshotDto[]> {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: dto.portfolioId, userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const snapshots = await this.db.riskSnapShots.findMany({
      where: { portfolioId: dto.portfolioId },
      orderBy: { snapShotAt: 'desc' },
      take: dto.limit || 10,
    });

    return snapshots.map(s => ({
      id: s.id,
      overallScore: s.overallScore,
      explanation: s.explanation,
      holdingScores: s.holdingScores as Record<string, number>,
      snapShotAt: s.snapShotAt.toISOString(),
    }));
  }

  /**
   * Set alert threshold for a holding
   * PRD: Risk Alerts - user sets threshold, alert fires when crossed
   */
  async setAlertThreshold(
    holdingId: string,
    dto: SetAlertThresholdDto,
    userId: string,
  ) {
    // Verify holding belongs to user's portfolio
    const holding = await this.db.holdings.findFirst({
      where: {
        id: holdingId,
        portfolio: { userId },
      },
    });

    if (!holding) {
      throw new NotFoundException('Holding not found');
    }

    // Upsert alert config
    const alert = await this.db.alertConfig.upsert({
      where: { id: holdingId }, // Using holdingId as the alert ID for simplicity
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
      symbol: holding.symbol,
      threshold: alert.threshold,
      reason: alert.reason,
      createdAt: alert.createdAt.toISOString(),
    };
  }

  /**
   * Get all alerts for user's portfolio
   */
  async getAlerts(userId: string) {
    const alerts = await this.db.alertConfig.findMany({
      where: {
        holdings: {
          portfolio: { userId },
        },
      },
      include: {
        holdings: true,
      },
    });

    return alerts.map(a => ({
      id: a.id,
      symbol: a.holdings.symbol,
      threshold: a.threshold,
      reason: a.reason,
      triggered: a.triggeredAt !== null,
      triggeredAt: a.triggeredAt?.toISOString(),
    }));
  }

  /**
   * Get full risk summary for a portfolio
   * PRD: Daily Use Flow - dashboard with risk score, alerts, anomalies
   */
  async getPortfolioRiskSummary(portfolioId: string, userId: string): Promise<PortfolioRiskSummaryDto> {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        holdings: true,
        snapshots: {
          orderBy: { snapShotAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Get latest risk score
    const latestSnapshot = portfolio.snapshots[0];
    const riskScore = latestSnapshot ? await this.formatRiskScore(latestSnapshot) : null;

    // Get alerts
    const alerts = await this.db.alertConfig.findMany({
      where: {
        holdings: { portfolioId },
      },
      include: {
        holdings: true,
      },
    });

    // Get active anomalies
    const anomalies = await this.db.anomalyFlag.findMany({
      where: {
        holdingId: { in: portfolio.holdings.map(h => h.id) },
        resolved: false,
      },
      include: { holdings: true },
    });

    // Calculate total value
    const symbols = portfolio.holdings.map(h => h.symbol);
    const livePrices = await this.bayse.getMultipleAssets(symbols);
    const totalValue = portfolio.holdings.reduce((sum, h) => {
      const price = livePrices.find(p => p.symbol === h.symbol)?.price || 0;
      return sum + price * Number(h.quantity);
    }, 0);

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        totalValue: Math.round(totalValue * 100) / 100,
      },
      risk: riskScore || {
        overallScore: 0,
        riskLevel: RiskLevel.LOW,
        explanation: 'No risk evaluation yet. Add holdings and trigger evaluation.',
        reasoningPath: [],
        anomalies: [],
        perAssetScores: [],
        evaluatedAt: new Date().toISOString(),
      },
      alerts: alerts.map(a => ({
        id: a.id,
        symbol: a.holdings.symbol,
        threshold: a.threshold,
        triggered: a.triggeredAt !== null,
      })),
      activeAnomalies: anomalies.map(a => ({
        symbol: a.holdings.symbol,
        reason: a.reason,
        severity: 'medium', // Could be enhanced with severity field
      })),
    };
  }

  /**
   * Detect and store anomalies
   * PRD: Anomaly Detection - flag unusual price movements
   */
  async detectAndStoreAnomalies(portfolioId: string): Promise<AlertTriggeredDto[]> {
    const portfolio = await this.db.portfolio.findFirst({
      where: { id: portfolioId },
      include: { holdings: true },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const symbols = portfolio.holdings.map(h => h.symbol);
    const anomalies = await this.bayse.detectAnomalies(symbols);
    const triggeredAlerts: AlertTriggeredDto[] = [];

    for (const anomaly of anomalies) {
      if (!anomaly.isAnomaly) continue;

      const holding = portfolio.holdings.find(h => h.symbol === anomaly.symbol);
      if (!holding) continue;

      // Store anomaly flag
      await this.db.anomalyFlag.create({
        data: {
          holdingId: holding.id,
          reason: anomaly.reason,
        },
      });

      // Check if alert threshold crossed
      const alert = await this.db.alertConfig.findFirst({
        where: { holdingId: holding.id },
      });

      if (alert && !alert.triggeredAt) {
        // For now, we need to get the current risk score
        // In production, this would be part of the evaluation flow
        this.logger.log(`Alert triggered for ${anomaly.symbol}: ${anomaly.reason}`);
        
        await this.db.alertConfig.update({
          where: { id: alert.id },
          data: { triggeredAt: new Date() },
        });

        triggeredAlerts.push({
          alertId: alert.id,
          symbol: anomaly.symbol,
          currentScore: 0, // Would come from risk evaluation
          threshold: alert.threshold,
          message: anomaly.reason,
          triggeredAt: new Date().toISOString(),
        });
      }
    }

    return triggeredAlerts;
  }

  /**
   * Internal: Check and trigger alerts based on risk score
   */
  private async checkAndTriggerAlerts(portfolioId: string, currentScore: number): Promise<void> {
    const alerts = await this.db.alertConfig.findMany({
      where: {
        holdings: { portfolioId },
        triggeredAt: null,
      },
    });

    for (const alert of alerts) {
      if (currentScore >= alert.threshold) {
        await this.db.alertConfig.update({
          where: { id: alert.id },
          data: { triggeredAt: new Date() },
        });
        this.logger.log(`Alert triggered: score ${currentScore} >= threshold ${alert.threshold}`);
      }
    }
  }

  /**
   * Internal: Format risk snapshot to response DTO
   */
  private async formatRiskScore(snapshot: any): Promise<RiskScoreDto> {
    const perAssetScores = Object.entries(snapshot.holdingScores as Record<string, number>).map(
      ([symbol, score]) => ({
        symbol,
        score,
        riskLevel: this.getRiskLevel(score),
        riskFactors: [], // Could be expanded with more detailed analysis
      }),
    );

    return {
      overallScore: snapshot.overallScore,
      riskLevel: this.getRiskLevel(snapshot.overallScore),
      explanation: snapshot.explanation,
      reasoningPath: [], // Would come from Gemini reasoning
      anomalies: [], // Would come from anomaly detection
      perAssetScores,
      evaluatedAt: snapshot.snapShotAt.toISOString(),
    };
  }

  /**
   * Internal: Convert score to risk level
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score < 25) return RiskLevel.LOW;
    if (score < 50) return RiskLevel.MEDIUM;
    if (score < 75) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }
}
