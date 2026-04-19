import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

export interface HoldingData {
  symbol: string;
  quantity: number;
  currentPrice: number;
  change24h: number;
  value: number;
}

export interface RiskAnalysisResult {
  overallScore: number;
  perAssetScores: Array<{
    symbol: string;
    score: number;
    riskFactors: string[];
  }>;
  explanation: string;
  reasoningPath: string[];
  anomalies: string[];
}

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are a quantitative risk analyst for Synth Sentry.
      You analyse financial portfolios and return structured JSON risk assessments.
      Always respond with valid JSON only. No markdown, no code blocks, no explanation outside the JSON.`,
    });
  }

  async analyzePortfolioRisk(
    holdings: HoldingData[],
    totalValue: number,
  ): Promise<RiskAnalysisResult> {
    const prompt = this.buildRiskAnalysisPrompt(holdings, totalValue);

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    this.logger.debug(`Gemini response: ${responseText}`);

    let parsed: RiskAnalysisResult;
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned) as RiskAnalysisResult;
    } catch (e) {
      this.logger.error(`Failed to parse Gemini response: ${responseText}`);
      throw new InternalServerErrorException('Gemini returned invalid JSON');
    }

    return parsed;
  }

  async simulateRiskChange(
    currentPortfolio: HoldingData[],
    hypotheticalChange: { symbol: string; newPrice: number },
  ): Promise<{ newScore: number; impact: string }> {
    const modifiedPortfolio = currentPortfolio.map((h) =>
      h.symbol === hypotheticalChange.symbol
        ? {
            ...h,
            currentPrice: hypotheticalChange.newPrice,
            value: h.quantity * hypotheticalChange.newPrice,
          }
        : h,
    );

    const newTotalValue = modifiedPortfolio.reduce((sum, h) => sum + h.value, 0);
    const analysis = await this.analyzePortfolioRisk(modifiedPortfolio, newTotalValue);

    return {
      newScore: analysis.overallScore,
      impact: analysis.explanation,
    };
  }

  private buildRiskAnalysisPrompt(
    holdings: HoldingData[],
    totalValue: number,
  ): string {
    const holdingsSummary = holdings
      .map(
        (h) =>
          `- ${h.symbol}: ${h.quantity} units @ $${h.currentPrice} (${h.change24h >= 0 ? '+' : ''}${h.change24h}% 24h) | Value: $${h.value.toFixed(2)} | Weight: ${((h.value / totalValue) * 100).toFixed(1)}%`,
      )
      .join('\n');

    return `Analyze this portfolio and return a structured risk assessment.

PORTFOLIO:
Total Value: $${totalValue.toFixed(2)}
Holdings:
${holdingsSummary}

ANALYSIS STEPS:
Step 1: Individual asset risk — volatility, concentration, recent price action
Step 2: Concentration risk — flag any asset exceeding 20% of total portfolio
Step 3: Correlation risk — are holdings in similar sectors or asset classes?
Step 4: Market context — what do the 24h price movements signal?
Step 5: Synthesize into an overall risk score 0-100

SCORING RUBRIC:
0-20: Very Low Risk
21-40: Low Risk
41-60: Moderate Risk
61-80: High Risk
81-100: Critical Risk

Return this exact JSON structure:
{
  "overallScore": number,
  "perAssetScores": [
    {
      "symbol": "string",
      "score": number,
      "riskFactors": ["string"]
    }
  ],
  "explanation": "2-3 sentence plain-language summary for the user",
  "reasoningPath": ["Step 1 finding", "Step 2 finding", "Step 3 finding", "Step 4 finding", "Step 5 synthesis"],
  "anomalies": ["any unusual patterns or concerns"]
}`;
  }
}