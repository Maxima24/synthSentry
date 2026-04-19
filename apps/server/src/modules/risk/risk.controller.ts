import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { RiskService } from './risk.service';
import {
  EvaluateRiskDto,
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

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate portfolio risk using Gemini AI + Bayse market data' })
  @ApiBody({ type: EvaluateRiskDto })
  @ApiResponse({ status: 201, description: 'Risk evaluation result', type: RiskScoreDto })
  @ApiResponse({ status: 400, description: 'No open positions to evaluate' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async evaluateRisk(
    @Request() req,
    @Body() dto: EvaluateRiskDto,
  ): Promise<RiskScoreDto> {
    return this.riskService.evaluatePortfolioRisk(dto, req.user.id);
  }

  @Get('history/:portfolioId')
  @ApiOperation({ summary: 'Get risk score history for a portfolio' })
  @ApiParam({ name: 'portfolioId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Risk history snapshots', type: [RiskSnapshotDto] })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getRiskHistory(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<RiskSnapshotDto[]> {
    return this.riskService.getRiskHistory({ portfolioId, limit }, req.user.id);
  }

  @Get('summary/:portfolioId')
  @ApiOperation({ summary: 'Get complete risk summary for a portfolio' })
  @ApiParam({ name: 'portfolioId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Portfolio risk summary', type: PortfolioRiskSummaryDto })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolioRiskSummary(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
  ): Promise<PortfolioRiskSummaryDto> {
    return this.riskService.getPortfolioRiskSummary(portfolioId, req.user.id);
  }

  @Post('anomalies/:portfolioId')
  @ApiOperation({ summary: 'Detect and store anomalies in portfolio positions' })
  @ApiParam({ name: 'portfolioId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 201, description: 'Detected anomalies and triggered alerts', type: [AlertTriggeredDto] })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async detectAnomalies(
    @Param('portfolioId') portfolioId: string,
  ): Promise<AlertTriggeredDto[]> {
    return this.riskService.detectAndStoreAnomalies(portfolioId);
  }

  // ← fixed: static route before parameterised route
  @Get('alerts')
  @ApiOperation({ summary: 'Get all risk alerts for the current user' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async getAlerts(@Request() req) {
    return this.riskService.getAlerts(req.user.id);
  }

  @Post('alerts/:holdingId')
  @ApiOperation({ summary: 'Set risk alert threshold for a holding' })
  @ApiParam({ name: 'holdingId', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({ type: SetAlertThresholdDto })
  @ApiResponse({ status: 201, description: 'Alert threshold set' })
  @ApiResponse({ status: 404, description: 'Holding not found' })
  async setAlertThreshold(
    @Request() req,
    @Param('holdingId') holdingId: string,
    @Body() dto: SetAlertThresholdDto,
  ) {
    return this.riskService.setAlertThreshold(holdingId, dto, req.user.id);
  }
}