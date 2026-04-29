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
