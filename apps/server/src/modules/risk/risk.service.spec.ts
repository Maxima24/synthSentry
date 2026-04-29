import { RiskService } from './risk.service';

describe('RiskService.evaluatePortfolioRisk (paper)', () => {
  it('builds HoldingData from DB holdings, calls Gemini, persists snapshot', async () => {
    const portfolioRecord = {
      id: 'p1',
      userId: 'u1',
      holdings: [
        {
          id: 'h1',
          symbol: 'evt-1',
          outcome: 'YES',
          eventTitle: 'Will X happen?',
          marketId: 'm1',
          entryPrice: '0.40',
          quantity: '100',
        },
      ],
    };
    const db = {
      portfolio: { findFirst: jest.fn().mockResolvedValue(portfolioRecord) },
      riskSnapShots: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 's1', snapShotAt: new Date() }),
        ),
      },
      alertConfig: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const bayse = {
      getEventCached: jest
        .fn()
        .mockResolvedValue({ yesPrice: 0.55, noPrice: 0.45, status: 'open' }),
      getMarketTicker: jest.fn().mockResolvedValue({ priceChange24h: 0.02 }),
    };
    const gemini = {
      analyzePortfolioRisk: jest.fn().mockResolvedValue({
        overallScore: 62,
        explanation: 'High concentration risk.',
        reasoningPath: ['Step 1', 'Step 2'],
        anomalies: ['Price moved >5% intraday'],
        perAssetScores: [
          { symbol: 'Will X happen?', score: 62, riskFactors: [] },
        ],
      }),
    };
    const service = new RiskService(db as any, bayse as any, gemini as any);

    const result = await service.evaluatePortfolioRisk(
      { portfolioId: 'p1', forceRefresh: true } as any,
      'u1',
    );

    expect(gemini.analyzePortfolioRisk).toHaveBeenCalled();
    const [holdingsArg, totalValueArg] = gemini.analyzePortfolioRisk.mock.calls[0];
    expect(holdingsArg[0]).toMatchObject({
      quantity: 100,
      currentPrice: 0.55,
      change24h: 0.02,
    });
    expect(holdingsArg[0].value).toBeCloseTo(55, 2);
    expect(totalValueArg).toBeCloseTo(55, 2);
    expect(result.overallScore).toBe(62);
    expect(result.reasoningPath).toEqual(['Step 1', 'Step 2']);
    expect(result.anomalies).toEqual(['Price moved >5% intraday']);
  });

  it('returns empty risk score for empty portfolio (does not throw)', async () => {
    const db = {
      portfolio: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'p1', userId: 'u1', holdings: [] }),
      },
      riskSnapShots: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new RiskService(db as any, {} as any, {} as any);

    const result = await service.evaluatePortfolioRisk(
      { portfolioId: 'p1', forceRefresh: true } as any,
      'u1',
    );

    expect(result.overallScore).toBe(0);
    expect(result.explanation).toMatch(/holdings/i);
  });
});
