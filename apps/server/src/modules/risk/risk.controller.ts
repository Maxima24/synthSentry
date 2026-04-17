import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RiskService } from './risk.service';
import {
  EvaluateRiskDto,
  GetRiskHistoryDto,
  SetAlertThresholdDto,
} from './dto/create-risk.dto';
import {
  RiskScoreDto,
  RiskSnapshotDto,
  AlertTriggeredDto,
  PortfolioRiskSummaryDto,
} from './dto/risk-response.dto';
import { JwtGuard } from 'src/common/utils/jwt-strategy.utils';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('risk')
@Controller('risk')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  /**
   * Evaluate risk for a portfolio
   * PRD: AI Risk Score - Gemini generates 0-100 risk score
   */
  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate portfolio risk using Gemini AI' })
  @ApiBody({ type: EvaluateRiskDto })
  @ApiResponse({
    status: 200,
    description: 'Risk evaluation result',
    type: RiskScoreDto,
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async evaluateRisk(
    @Request() req,
    @Body() dto: EvaluateRiskDto,
  ): Promise<RiskScoreDto> {
    return this.riskService.evaluatePortfolioRisk(dto, req.user.id);
  }

  /**
   * Get risk history for a portfolio
   * PRD: Risk History Chart (P1) - time-series of risk score
   */
  @Get('history/:portfolioId')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get risk score history for a portfolio' })
  @ApiParam({ name: 'portfolioId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiQuery({ name: 'limit', example: '10', required: false })
  @ApiResponse({
    status: 200,
    description: 'Risk history snapshots',
    type: [RiskSnapshotDto],
  })
  async getRiskHistory(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
    @Query('limit') limit?: number,
  ): Promise<RiskSnapshotDto[]> {
    return this.riskService.getRiskHistory(
      { portfolioId, limit: limit ? Number(limit) : undefined },
      req.user.id,
    );
  }

  /**
   * Set alert threshold for a holding
   * PRD: Risk Alerts - user sets threshold, alert fires when crossed
   */
  @Post('alerts/:holdingId')
  @ApiOperation({ summary: 'Set risk alert threshold for a holding' })
  @UseGuards(JwtGuard)
  @ApiParam({ name: 'holdingId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @UseGuards(JwtGuard)
  @ApiBody({ type: SetAlertThresholdDto })
  @ApiResponse({
    status: 200,
    description: 'Alert threshold set',
  })
  async setAlertThreshold(
    @Request() req,
    @Param('holdingId') holdingId: string,
    @Body() dto: SetAlertThresholdDto,
  ) {
    return this.riskService.setAlertThreshold(holdingId, dto, req.user.id);
  }

  /**
   * Get all alerts for user's portfolios
   */
  @Get('alerts')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get all risk alerts' })
  @ApiResponse({
    status: 200,
    description: 'List of alerts',
  })
  async getAlerts(@Request() req) {
    return this.riskService.getAlerts(req.user.id);
  }

  /**
   * Get full risk summary for a portfolio
   * PRD: Daily Use Flow - dashboard with risk score, alerts, anomalies
   */
  @Get('summary/:portfolioId')
  @ApiOperation({ summary: 'Get complete risk summary for a portfolio' })
  @ApiParam({ name: 'portfolioId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @UseGuards(JwtGuard)
  @ApiResponse({
    status: 200,
    description: 'Portfolio risk summary',
    type: PortfolioRiskSummaryDto,
  })
  async getPortfolioRiskSummary(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
  ): Promise<PortfolioRiskSummaryDto> {
    return this.riskService.getPortfolioRiskSummary(portfolioId, req.user.id);
  }

  /**
   * Detect anomalies for a portfolio
   * PRD: Anomaly Detection - flag unusual price movements
   */
  @Post('anomalies/:portfolioId')
  @ApiOperation({ summary: 'Detect anomalies in portfolio holdings' })
  @ApiParam({ name: 'portfolioId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @UseGuards(JwtGuard)
  @ApiResponse({
    status: 200,
    description: 'Detected anomalies and triggered alerts',
    type: [AlertTriggeredDto],
  })
  async detectAnomalies(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
  ): Promise<AlertTriggeredDto[]> {
    return this.riskService.detectAndStoreAnomalies(portfolioId);
  }
}
