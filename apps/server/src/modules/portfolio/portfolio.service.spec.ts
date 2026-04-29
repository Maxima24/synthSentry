import { PortfolioService } from './portfolio.service';

const noopLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;

describe('PortfolioService.addHolding (weighted-avg paper trading)', () => {
  it('captures YES price + eventTitle + marketId on first buy', async () => {
    const upsert = jest.fn().mockResolvedValue({ id: 'h1' });
    const db = {
      portfolio: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }) },
      holdings: { findUnique: jest.fn().mockResolvedValue(null), upsert },
    };
    const bayse = {
      getEvent: jest.fn().mockResolvedValue({
        id: 'evt-1',
        title: 'Will X happen?',
        markets: [{ id: 'mkt-1' }],
        yesPrice: 0.5,
        noPrice: 0.5,
        status: 'open',
      }),
    };
    const service = new PortfolioService(noopLogger, db as any, bayse as any);

    await service.addHolding('u1', 'p1', { symbol: 'evt-1', outcome: 'YES', quantity: 30 });

    expect(upsert).toHaveBeenCalledTimes(1);
    const arg = upsert.mock.calls[0][0];
    expect(arg.where).toEqual({
      symbol_outcome_portfolioId: { symbol: 'evt-1', outcome: 'YES', portfolioId: 'p1' },
    });
    expect(arg.create).toMatchObject({
      portfolioId: 'p1',
      symbol: 'evt-1',
      outcome: 'YES',
      eventTitle: 'Will X happen?',
      marketId: 'mkt-1',
      entryPrice: 0.5,
      quantity: 30,
    });
  });

  it('weighted-averages entryPrice when adding to an existing (event, outcome)', async () => {
    const upsert = jest.fn().mockResolvedValue({ id: 'h1' });
    const existing = {
      id: 'h1',
      quantity: { toString: () => '10' },
      entryPrice: { toString: () => '0.40' },
    };
    const db = {
      portfolio: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }) },
      holdings: { findUnique: jest.fn().mockResolvedValue(existing), upsert },
    };
    const bayse = {
      getEvent: jest.fn().mockResolvedValue({
        id: 'evt-1',
        title: 'Will X happen?',
        markets: [{ id: 'mkt-1' }],
        yesPrice: 0.5,
        noPrice: 0.5,
        status: 'open',
      }),
    };
    const service = new PortfolioService(noopLogger, db as any, bayse as any);

    await service.addHolding('u1', 'p1', { symbol: 'evt-1', outcome: 'YES', quantity: 30 });

    const arg = upsert.mock.calls[0][0];
    // (10 * 0.40 + 30 * 0.50) / 40 = (4 + 15) / 40 = 0.475
    expect(arg.update.quantity).toBe(40);
    expect(arg.update.entryPrice).toBeCloseTo(0.475, 5);
  });

  it('rejects an invalid Bayse eventId with BadRequest', async () => {
    const db = {
      portfolio: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }) },
    };
    const bayse = { getEvent: jest.fn().mockRejectedValue(new Error('404 not found')) };
    const service = new PortfolioService(noopLogger, db as any, bayse as any);

    await expect(
      service.addHolding('u1', 'p1', { symbol: 'bad', outcome: 'YES', quantity: 1 }),
    ).rejects.toThrow(/not found/i);
  });
});

describe('PortfolioService.getPortfolioWithLivePrices (mark-to-market)', () => {
  it('marks holdings to market via cached events and returns P&L', async () => {
    const db = {
      portfolio: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'p1', name: 'Demo', userId: 'u1',
          holdings: [
            { id: 'h1', symbol: 'evt-1', outcome: 'YES', eventTitle: 'A?', marketId: 'm1', entryPrice: '0.40', quantity: '100' },
            { id: 'h2', symbol: 'evt-2', outcome: 'NO',  eventTitle: 'B?', marketId: 'm2', entryPrice: '0.30', quantity: '50' },
          ],
        }),
      },
    };
    const bayse = {
      getEventCached: jest.fn()
        .mockImplementation((id: string) =>
          id === 'evt-1'
            ? Promise.resolve({ id: 'evt-1', yesPrice: 0.50, noPrice: 0.50, status: 'open' })
            : Promise.resolve({ id: 'evt-2', yesPrice: 0.60, noPrice: 0.40, status: 'open' }),
        ),
    };
    const service = new PortfolioService(noopLogger, db as any, bayse as any);

    const result = await service.getPortfolioWithLivePrices('p1', 'u1');

    expect(result.holdings[0]).toMatchObject({
      currentPrice: 0.50, currentValue: 50, pnl: 10, pnlPercent: 25,
    });
    expect(result.holdings[1].currentPrice).toBeCloseTo(0.40, 5);
    expect(result.holdings[1].currentValue).toBeCloseTo(20, 5);
    expect(result.holdings[1].pnl).toBeCloseTo(5, 5);
    expect(result.holdings[1].pnlPercent).toBeCloseTo(33.333, 2);
    expect(result.totalValue).toBeCloseTo(70, 2);
    expect(result.totalCost).toBeCloseTo(55, 2);
    expect(result.totalPnl).toBeCloseTo(15, 2);
    expect(result).not.toHaveProperty('wallet');
  });

  it('returns null prices for events that fail/timeout, does not throw', async () => {
    const db = {
      portfolio: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'p1', name: 'Demo', userId: 'u1',
          holdings: [
            { id: 'h1', symbol: 'evt-1', outcome: 'YES', eventTitle: 'A?', marketId: 'm1', entryPrice: '0.40', quantity: '100' },
          ],
        }),
      },
    };
    const bayse = { getEventCached: jest.fn().mockRejectedValue(new Error('timeout')) };
    const service = new PortfolioService(noopLogger, db as any, bayse as any);

    const result = await service.getPortfolioWithLivePrices('p1', 'u1');

    expect(result.holdings[0]).toMatchObject({
      currentPrice: null, currentValue: null, pnl: null, isStale: true,
    });
    expect(result.totalValue).toBe(0);
    expect(result.totalCost).toBeCloseTo(40, 2);
  });
});
