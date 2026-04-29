# Paper-Trading Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the SynthSentry holdings, portfolio-detail, and AI-risk flows from "mirror the user's real Bayse brokerage account" to "paper trading: holdings live in our DB, marked-to-market via Bayse public market data."

**Architecture:** Server stores holdings with outcome (YES/NO) + entry price captured from Bayse at add-time. Portfolio reads price live events from Bayse with a 30s in-memory cache. Risk evaluation reads holdings from DB, prices them via the same cache, and surfaces Gemini's `reasoningPath` + `anomalies` (currently silently dropped) to the UI.

**Tech Stack:** NestJS 10 (`apps/server/`), Prisma + Postgres, Next 16.2.3 / React 19 (`apps/web/`), TanStack Query, Tailwind v4, Hugeicons.

**Spec:** [docs/superpowers/specs/2026-04-29-paper-trading-portfolio-design.md](../specs/2026-04-29-paper-trading-portfolio-design.md)

**Reference paths used in this plan** (relative to `frontend/`):
- Server: `apps/server/src/`
- Web: `apps/web/app/`
- Prisma: `apps/server/prisma/`

---

## Task 1: Schema migration — Holdings + RiskSnapShots

**Files:**
- Modify: `apps/server/prisma/schema.prisma`
- Create: `apps/server/prisma/migrations/<timestamp>_paper_trading_schema/migration.sql` (generated)

- [ ] **Step 1.1: Update `Holdings` and `RiskSnapShots` models**

Replace the `Holdings` and `RiskSnapShots` models in `apps/server/prisma/schema.prisma` with:

```prisma
model Holdings {
  id          String        @id @default(uuid())
  symbol      String        // Bayse eventId
  eventTitle  String        // captured at add-time
  marketId    String        // captured at add-time, used by getMarketTicker
  outcome     String        // "YES" | "NO"
  entryPrice  Decimal       // weighted-avg implied probability paid in (0.00–1.00)
  quantity    Decimal
  portfolioId String
  portfolio   Portfolio     @relation(references: [id], fields: [portfolioId], onDelete: Cascade)
  alerts      AlertConfig[]
  anomalies   AnomalyFlag[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([symbol, outcome, portfolioId])
}

model RiskSnapShots {
  id            String    @id @default(uuid())
  portfolioId   String
  portfolio     Portfolio @relation(fields: [portfolioId], references: [id])
  overallScore  Int
  riskLevel     String    @default("low")
  explanation   String
  reasoningPath Json
  anomalies     Json
  holdingScores Json
  snapShotAt    DateTime  @default(now())
}
```

- [ ] **Step 1.2: Create the migration (clean-slate — drops existing Holdings rows)**

Run from `apps/server/`:

```bash
npx prisma migrate dev --name paper_trading_schema --create-only
```

Open the generated `migration.sql` and confirm it begins with `DELETE FROM "Holdings";` (or `TRUNCATE "Holdings" CASCADE;`). If Prisma did not emit a delete (because the new columns are NOT NULL with no default and Prisma can't auto-resolve), prepend it manually before the `ALTER TABLE` statements:

```sql
TRUNCATE TABLE "Holdings" CASCADE;
TRUNCATE TABLE "RiskSnapShots" CASCADE;
```

Then run the migration:

```bash
npx prisma migrate dev
```

- [ ] **Step 1.3: Regenerate Prisma client**

Run from `apps/server/`:

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`. This unblocks the TypeScript errors for `db.holdings`, `db.riskSnapShots`, etc., that the typecheck currently surfaces.

- [ ] **Step 1.4: Commit**

```bash
git add apps/server/prisma/schema.prisma apps/server/prisma/migrations/
git commit -m "feat(schema): add outcome+entryPrice on Holdings, reasoningPath+anomalies on RiskSnapShots"
```

---

## Task 2: Add 30s event cache to BayseService

**Files:**
- Modify: `apps/server/src/modules/bayse/bayse.service.ts`
- Test: `apps/server/src/modules/bayse/bayse.service.spec.ts`

The cache is shared by `getPortfolioWithLivePrices` and `evaluatePortfolioRisk` so repeated portfolio loads during the demo are <100ms.

- [ ] **Step 2.1: Write the failing test**

Append to `apps/server/src/modules/bayse/bayse.service.spec.ts`:

```ts
describe('BayseService.getEventCached', () => {
  it('returns cached event within TTL without re-calling getEvent', async () => {
    const mod = await Test.createTestingModule({
      providers: [BayseService, { provide: ConfigService, useValue: { get: () => 'fake' } }, { provide: LoggerService, useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() } }],
    }).compile();
    const service = mod.get(BayseService);

    const fakeEvent = { id: 'evt-1', title: 'X', yesPrice: 0.5, noPrice: 0.5 } as any;
    const spy = jest.spyOn(service, 'getEvent').mockResolvedValue(fakeEvent);

    const a = await service.getEventCached('evt-1');
    const b = await service.getEventCached('evt-1');

    expect(a).toBe(fakeEvent);
    expect(b).toBe(fakeEvent);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

Run from `apps/server/`:

```bash
npx jest src/modules/bayse/bayse.service.spec.ts -t "getEventCached"
```

Expected: FAIL with "service.getEventCached is not a function".

- [ ] **Step 2.3: Add cache to BayseService**

In `apps/server/src/modules/bayse/bayse.service.ts`, add to the class body (near the top, after the existing private fields):

```ts
private readonly eventCache = new Map<
  string,
  { value: BayseEventDto; expiresAt: number }
>();
private readonly EVENT_CACHE_TTL_MS = 30_000;
private readonly EVENT_FETCH_TIMEOUT_MS = 2_000;

async getEventCached(eventId: string): Promise<BayseEventDto> {
  const hit = this.eventCache.get(eventId);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await this.raceWithTimeout(
    this.getEvent(eventId),
    this.EVENT_FETCH_TIMEOUT_MS,
  );
  this.eventCache.set(eventId, {
    value,
    expiresAt: Date.now() + this.EVENT_CACHE_TTL_MS,
  });
  return value;
}

private raceWithTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`bayse timeout ${ms}ms`)), ms),
    ),
  ]);
}
```

- [ ] **Step 2.4: Run test to verify it passes**

```bash
npx jest src/modules/bayse/bayse.service.spec.ts -t "getEventCached"
```

Expected: PASS.

- [ ] **Step 2.5: Commit**

```bash
git add apps/server/src/modules/bayse/bayse.service.ts apps/server/src/modules/bayse/bayse.service.spec.ts
git commit -m "feat(bayse): add 30s event cache + 2s timeout for getEventCached"
```

---

## Task 3: AddHoldingDto + addHolding service rewrite

**Files:**
- Modify: `apps/server/src/modules/portfolio/dto/add-holding.dto.ts`
- Modify: `apps/server/src/modules/portfolio/portfolio.service.ts:42-75`
- Test: `apps/server/src/modules/portfolio/portfolio.service.spec.ts`

- [ ] **Step 3.1: Update AddHoldingDto**

Replace the contents of `apps/server/src/modules/portfolio/dto/add-holding.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsUUID, Min } from 'class-validator';

export class AddHoldingDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Bayse event ID — use GET /portfolio/search to find valid event IDs',
  })
  @IsUUID()
  symbol!: string;

  @ApiProperty({
    enum: ['YES', 'NO'],
    example: 'YES',
    description: 'Side of the prediction market the user is paper-buying',
  })
  @IsIn(['YES', 'NO'])
  outcome!: 'YES' | 'NO';

  @ApiProperty({ example: 50, description: 'Number of shares to add', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}
```

- [ ] **Step 3.2: Write the failing test for weighted-avg math**

Append to `apps/server/src/modules/portfolio/portfolio.service.spec.ts`:

```ts
describe('PortfolioService.addHolding (weighted-avg)', () => {
  it('weighted-averages entryPrice when adding to an existing (event, outcome)', async () => {
    const db = {
      portfolio: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }) },
      holdings: {
        upsert: jest.fn().mockResolvedValue({ id: 'h1' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'h1', quantity: { toNumber: () => 10 }, entryPrice: { toNumber: () => 0.40 },
        }),
      },
    };
    const bayse = {
      getEvent: jest.fn().mockResolvedValue({
        id: 'evt-1', title: 'Will X happen?', marketId: 'mkt-1', yesPrice: 0.50, noPrice: 0.50, status: 'open',
      }),
    };
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;
    const service = new PortfolioService(logger, db as any, bayse as any);

    await service.addHolding('u1', 'p1', { symbol: 'evt-1', outcome: 'YES', quantity: 30 });

    const upsertArg = db.holdings.upsert.mock.calls[0][0];
    expect(upsertArg.create).toMatchObject({
      symbol: 'evt-1', outcome: 'YES', eventTitle: 'Will X happen?', marketId: 'mkt-1',
      entryPrice: 0.50, quantity: 30,
    });
    // update path: oldQty=10@0.40 + newQty=30@0.50 → newAvg = (10*0.40 + 30*0.50)/40 = 0.475
    expect(upsertArg.update).toMatchObject({
      quantity: 40,
      entryPrice: 0.475,
    });
  });

  it('rejects an invalid Bayse eventId', async () => {
    const db = { portfolio: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }) } };
    const bayse = { getEvent: jest.fn().mockRejectedValue(new Error('not found')) };
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;
    const service = new PortfolioService(logger, db as any, bayse as any);

    await expect(
      service.addHolding('u1', 'p1', { symbol: 'bad', outcome: 'YES', quantity: 1 }),
    ).rejects.toThrow(/not found/i);
  });
});
```

- [ ] **Step 3.3: Run test to verify it fails**

```bash
npx jest src/modules/portfolio/portfolio.service.spec.ts -t "weighted-avg"
```

Expected: FAIL.

- [ ] **Step 3.4: Replace `addHolding` implementation**

In `apps/server/src/modules/portfolio/portfolio.service.ts`, replace the existing `addHolding` method (lines 42-75) with:

```ts
async addHolding(userId: string, portfolioId: string, dto: AddHoldingDto) {
  const portfolio = await this.db.portfolio.findFirst({
    where: { id: portfolioId, userId },
  });
  if (!portfolio) throw new NotFoundException('Portfolio not found');

  const event = await this.bayse.getEvent(dto.symbol).catch(() => null);
  if (!event) {
    throw new BadRequestException(
      `Bayse event '${dto.symbol}' not found. Provide a valid eventId.`,
    );
  }

  const priceNow = dto.outcome === 'YES' ? event.yesPrice : event.noPrice;

  const existing = await this.db.holdings.findUnique({
    where: {
      symbol_outcome_portfolioId: {
        symbol: dto.symbol,
        outcome: dto.outcome,
        portfolioId,
      },
    },
  });

  let newQty = dto.quantity;
  let newAvg = priceNow;
  if (existing) {
    const oldQty = Number(existing.quantity);
    const oldPrice = Number(existing.entryPrice);
    newQty = oldQty + dto.quantity;
    // weighted-avg new lot into existing position
    newAvg = (oldQty * oldPrice + dto.quantity * priceNow) / newQty;
  }

  return this.db.holdings.upsert({
    where: {
      symbol_outcome_portfolioId: {
        symbol: dto.symbol,
        outcome: dto.outcome,
        portfolioId,
      },
    },
    update: { quantity: newQty, entryPrice: newAvg },
    create: {
      portfolioId,
      symbol: dto.symbol,
      outcome: dto.outcome,
      eventTitle: event.title,
      marketId: event.marketId,
      entryPrice: priceNow,
      quantity: dto.quantity,
    },
  });
}
```

- [ ] **Step 3.5: Run test to verify it passes**

```bash
npx jest src/modules/portfolio/portfolio.service.spec.ts -t "weighted-avg"
```

Expected: PASS for both cases.

- [ ] **Step 3.6: Commit**

```bash
git add apps/server/src/modules/portfolio/dto/add-holding.dto.ts apps/server/src/modules/portfolio/portfolio.service.ts apps/server/src/modules/portfolio/portfolio.service.spec.ts
git commit -m "feat(portfolio): capture outcome+entryPrice with weighted-avg add"
```

---

## Task 4: Rewrite getPortfolioWithLivePrices

**Files:**
- Modify: `apps/server/src/modules/portfolio/portfolio.service.ts:99-150`
- Test: `apps/server/src/modules/portfolio/portfolio.service.spec.ts`

- [ ] **Step 4.1: Write the failing test**

Append to `apps/server/src/modules/portfolio/portfolio.service.spec.ts`:

```ts
describe('PortfolioService.getPortfolioWithLivePrices', () => {
  it('marks holdings to market via cached events and returns P&L', async () => {
    const db = {
      portfolio: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'p1', name: 'Demo', userId: 'u1',
          holdings: [
            { id: 'h1', symbol: 'evt-1', outcome: 'YES', eventTitle: 'A?', marketId: 'm1', entryPrice: { toNumber: () => 0.40 }, quantity: { toNumber: () => 100 } },
            { id: 'h2', symbol: 'evt-2', outcome: 'NO',  eventTitle: 'B?', marketId: 'm2', entryPrice: { toNumber: () => 0.30 }, quantity: { toNumber: () => 50 }  },
          ],
        }),
      },
    };
    const bayse = {
      getEventCached: jest.fn()
        .mockResolvedValueOnce({ id: 'evt-1', yesPrice: 0.50, noPrice: 0.50, status: 'open' })
        .mockResolvedValueOnce({ id: 'evt-2', yesPrice: 0.60, noPrice: 0.40, status: 'open' }),
    };
    const service = new PortfolioService({ log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any, db as any, bayse as any);

    const result = await service.getPortfolioWithLivePrices('p1', 'u1');

    expect(result.holdings[0]).toMatchObject({ currentPrice: 0.50, currentValue: 50, pnl: 10, pnlPercent: 25 });
    expect(result.holdings[1].currentPrice).toBeCloseTo(0.40, 5);
    expect(result.holdings[1].currentValue).toBeCloseTo(20, 5);
    expect(result.holdings[1].pnl).toBeCloseTo(5, 5);
    expect(result.holdings[1].pnlPercent).toBeCloseTo(33.333, 2);
    expect(result.totalValue).toBeCloseTo(70, 2);
    expect(result.totalCost).toBeCloseTo(55, 2);  // 100*0.40 + 50*0.30 = 40+15 = 55
    expect(result.totalPnl).toBeCloseTo(15, 2);
    expect(result).not.toHaveProperty('wallet');
  });

  it('returns null prices for events that fail/timeout, does not throw', async () => {
    const db = {
      portfolio: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'p1', name: 'Demo', userId: 'u1',
          holdings: [
            { id: 'h1', symbol: 'evt-1', outcome: 'YES', eventTitle: 'A?', marketId: 'm1', entryPrice: { toNumber: () => 0.40 }, quantity: { toNumber: () => 100 } },
          ],
        }),
      },
    };
    const bayse = { getEventCached: jest.fn().mockRejectedValue(new Error('timeout')) };
    const service = new PortfolioService({ log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any, db as any, bayse as any);

    const result = await service.getPortfolioWithLivePrices('p1', 'u1');

    expect(result.holdings[0]).toMatchObject({ currentPrice: null, currentValue: null, pnl: null, isStale: true });
    expect(result.totalValue).toBe(0);
  });
});

```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
npx jest src/modules/portfolio/portfolio.service.spec.ts -t "getPortfolioWithLivePrices"
```

Expected: FAIL.

- [ ] **Step 4.3: Replace `getPortfolioWithLivePrices` implementation**

In `apps/server/src/modules/portfolio/portfolio.service.ts`, replace the existing method (lines 99-150) with:

```ts
async getPortfolioWithLivePrices(portfolioId: string, userId: string) {
  const portfolio = await this.db.portfolio.findFirst({
    where: { id: portfolioId, userId },
    include: { holdings: true },
  });
  if (!portfolio) throw new NotFoundException('Portfolio not found');

  const priced = await Promise.all(
    portfolio.holdings.map(async (h) => {
      const event = await this.bayse
        .getEventCached(h.symbol)
        .catch(() => null);

      const entryPrice = Number(h.entryPrice);
      const quantity = Number(h.quantity);
      const costBasis = entryPrice * quantity;

      if (!event) {
        return {
          id: h.id,
          symbol: h.symbol,
          eventTitle: h.eventTitle,
          outcome: h.outcome,
          quantity,
          entryPrice,
          currentPrice: null,
          currentValue: null,
          costBasis,
          pnl: null,
          pnlPercent: null,
          payoutIfWins: quantity,
          isLive: false,
          isStale: true,
        };
      }

      const currentPrice = h.outcome === 'YES' ? event.yesPrice : event.noPrice;
      const currentValue = currentPrice * quantity;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return {
        id: h.id,
        symbol: h.symbol,
        eventTitle: h.eventTitle,
        outcome: h.outcome,
        quantity,
        entryPrice,
        currentPrice,
        currentValue,
        costBasis,
        pnl,
        pnlPercent,
        payoutIfWins: quantity,
        isLive: event.status === 'open',
        isStale: false,
      };
    }),
  );

  const totalValue = priced.reduce((s, h) => s + (h.currentValue ?? 0), 0);
  const totalCost = priced.reduce((s, h) => s + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return {
    id: portfolio.id,
    name: portfolio.name,
    userId: portfolio.userId,
    holdings: priced,
    totalValue,
    totalCost,
    totalPnl,
    totalPnlPercent,
    openPositions: priced.filter((h) => h.isLive).length,
    lastUpdated: new Date(),
  };
}
```

Also update the imports at the top of the file: remove `BayseService`-only imports if they reference `getPortfolio` or `getWalletAssets` types — those calls are gone.

- [ ] **Step 4.4: Run tests**

```bash
npx jest src/modules/portfolio/portfolio.service.spec.ts
```

Expected: all tests in this file PASS.

- [ ] **Step 4.5: Commit**

```bash
git add apps/server/src/modules/portfolio/portfolio.service.ts apps/server/src/modules/portfolio/portfolio.service.spec.ts
git commit -m "feat(portfolio): mark-to-market via cached Bayse events; drop wallet field"
```

---

## Task 5: Rewrite evaluatePortfolioRisk + fix formatRiskScore

**Files:**
- Modify: `apps/server/src/modules/risk/risk.service.ts`
- Test: `apps/server/src/modules/risk/risk.service.spec.ts`

- [ ] **Step 5.1: Write the failing test**

Append to `apps/server/src/modules/risk/risk.service.spec.ts`:

```ts
describe('RiskService.evaluatePortfolioRisk (paper)', () => {
  it('builds HoldingData from DB holdings and calls Gemini', async () => {
    const portfolioRecord = { id: 'p1', userId: 'u1', holdings: [
      { id: 'h1', symbol: 'evt-1', outcome: 'YES', eventTitle: 'Will X happen?', marketId: 'm1', entryPrice: { toNumber: () => 0.40 }, quantity: { toNumber: () => 100 } },
    ]};
    const db = {
      portfolio: { findFirst: jest.fn().mockResolvedValue(portfolioRecord) },
      riskSnapShots: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 's1', snapShotAt: new Date() })),
      },
      alertConfig: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const bayse = {
      getEventCached: jest.fn().mockResolvedValue({ yesPrice: 0.55, noPrice: 0.45, status: 'open' }),
      getMarketTicker: jest.fn().mockResolvedValue({ priceChange24h: 0.02 }),
    };
    const gemini = {
      analyzePortfolioRisk: jest.fn().mockResolvedValue({
        overallScore: 62,
        explanation: 'High concentration risk.',
        reasoningPath: ['Step 1', 'Step 2'],
        anomalies: ['Price moved >5% intraday'],
        perAssetScores: [{ symbol: 'Will X happen?', score: 62, riskFactors: [] }],
      }),
    };
    const service = new RiskService(db as any, bayse as any, gemini as any);

    const result = await service.evaluatePortfolioRisk({ portfolioId: 'p1', forceRefresh: true } as any, 'u1');

    expect(gemini.analyzePortfolioRisk).toHaveBeenCalled();
    const [holdingsArg, totalValueArg] = gemini.analyzePortfolioRisk.mock.calls[0];
    expect(holdingsArg[0]).toMatchObject({ quantity: 100, currentPrice: 0.55, change24h: 0.02, value: 55 });
    expect(totalValueArg).toBeCloseTo(55, 2);
    expect(result.overallScore).toBe(62);
    expect(result.reasoningPath).toEqual(['Step 1', 'Step 2']);
    expect(result.anomalies).toEqual(['Price moved >5% intraday']);
  });

  it('returns empty risk score for empty portfolio (does not throw)', async () => {
    const db = {
      portfolio: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', userId: 'u1', holdings: [] }) },
      riskSnapShots: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new RiskService(db as any, {} as any, {} as any);

    const result = await service.evaluatePortfolioRisk({ portfolioId: 'p1', forceRefresh: true } as any, 'u1');

    expect(result.overallScore).toBe(0);
    expect(result.explanation).toMatch(/add holdings/i);
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

```bash
npx jest src/modules/risk/risk.service.spec.ts -t "evaluatePortfolioRisk \\(paper\\)"
```

Expected: FAIL — service still calls `bayse.getPortfolio()`.

- [ ] **Step 5.3: Rewrite `evaluatePortfolioRisk`**

In `apps/server/src/modules/risk/risk.service.ts`, replace the existing `evaluatePortfolioRisk` method (lines 36-93) with:

```ts
async evaluatePortfolioRisk(
  dto: EvaluateRiskDto,
  userId: string,
): Promise<RiskScoreDto> {
  const portfolioRecord = await this.db.portfolio.findFirst({
    where: { id: dto.portfolioId, userId },
    include: { holdings: true },
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

  if (portfolioRecord.holdings.length === 0) {
    return this.emptyRiskScore();
  }

  const priced = await Promise.allSettled(
    portfolioRecord.holdings.map(async (h) => {
      const event = await this.bayse.getEventCached(h.symbol);
      const currentPrice = h.outcome === 'YES' ? event.yesPrice : event.noPrice;
      const change24h = await this.bayse
        .getMarketTicker(h.marketId, h.outcome)
        .then((t) => t.priceChange24h)
        .catch(() => 0);
      const quantity = Number(h.quantity);
      return {
        symbol: this.shortLabel(h.eventTitle),
        eventId: h.symbol,
        quantity,
        currentPrice,
        change24h,
        value: currentPrice * quantity,
      };
    }),
  );

  const successful = priced
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map((r) => r.value);

  if (successful.length === 0) {
    throw new BadRequestException('Market data temporarily unavailable. Try again in a moment.');
  }

  const holdingsData: HoldingData[] = successful.map(({ eventId, ...rest }) => rest);
  const totalValue = successful.reduce((s, h) => s + h.value, 0);

  const geminiAnalysis = await this.gemini.analyzePortfolioRisk(holdingsData, totalValue);

  const holdingScores = successful.reduce<Record<string, number>>((acc, h) => {
    const match = geminiAnalysis.perAssetScores.find((s) => s.symbol === h.symbol);
    acc[h.eventId] = match?.score ?? geminiAnalysis.overallScore;
    return acc;
  }, {});

  const snapshot = await this.db.riskSnapShots.create({
    data: {
      portfolioId: dto.portfolioId,
      overallScore: geminiAnalysis.overallScore,
      riskLevel: this.getRiskLevel(geminiAnalysis.overallScore),
      explanation: geminiAnalysis.explanation,
      reasoningPath: geminiAnalysis.reasoningPath,
      anomalies: geminiAnalysis.anomalies,
      holdingScores,
    },
  });

  await this.checkAndTriggerAlerts(dto.portfolioId, geminiAnalysis.overallScore);

  return this.formatRiskScore(snapshot);
}
```

- [ ] **Step 5.4: Fix `formatRiskScore` to read from snapshot**

In the same file, replace the existing `formatRiskScore` method with:

```ts
private formatRiskScore(snapshot: any): RiskScoreDto {
  const perAssetScores = Object.entries(
    (snapshot.holdingScores as Record<string, number>) ?? {},
  ).map(([symbol, score]) => ({
    symbol,
    score,
    riskLevel: this.getRiskLevel(score),
    riskFactors: [],
  }));

  return {
    overallScore: snapshot.overallScore,
    riskLevel: snapshot.riskLevel ?? this.getRiskLevel(snapshot.overallScore),
    explanation: snapshot.explanation,
    reasoningPath: (snapshot.reasoningPath as string[]) ?? [],
    anomalies: (snapshot.anomalies as string[]) ?? [],
    perAssetScores,
    evaluatedAt: snapshot.snapShotAt.toISOString(),
  };
}
```

- [ ] **Step 5.5: Strip wallet/getPortfolio from `getPortfolioRiskSummary`**

In the same file, in `getPortfolioRiskSummary`, remove the `bayse.getPortfolio()` and `bayse.getWalletAssets()` calls inside the `Promise.all`. Replace the `portfolio:` block in the return with values derived from `getPortfolioWithLivePrices`:

Replace the `Promise.all` and `return` block of `getPortfolioRiskSummary` with:

```ts
const [livePortfolio, alerts, anomalies] = await Promise.all([
  this.db.portfolio.findFirst({
    where: { id: portfolioId },
    include: { holdings: true },
  }),
  this.db.alertConfig.findMany({
    where: { holdings: { portfolioId } },
    include: { holdings: true },
  }),
  this.db.anomalyFlag.findMany({
    where: { holdings: { portfolio: { id: portfolioId } }, resolved: false },
    include: { holdings: true },
  }),
]);

// Mark each holding to market with the cached event price
const priced = await Promise.all(
  (livePortfolio?.holdings ?? []).map(async (h) => {
    const event = await this.bayse.getEventCached(h.symbol).catch(() => null);
    if (!event) return { costBasis: Number(h.entryPrice) * Number(h.quantity), currentValue: 0 };
    const currentPrice = h.outcome === 'YES' ? event.yesPrice : event.noPrice;
    return {
      costBasis: Number(h.entryPrice) * Number(h.quantity),
      currentValue: currentPrice * Number(h.quantity),
    };
  }),
);
const totalValue = priced.reduce((s, p) => s + p.currentValue, 0);
const totalCost = priced.reduce((s, p) => s + p.costBasis, 0);
const totalPnl = totalValue - totalCost;
const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

const latestSnapshot = portfolioRecord.snapshots[0];
const riskScore = latestSnapshot
  ? this.formatRiskScore(latestSnapshot)
  : this.emptyRiskScore();

return {
  portfolio: {
    id: portfolioRecord.id,
    name: portfolioRecord.name,
    totalValue,
    totalCost,
    totalPercentageChange: totalPnlPercent,
    openPositions: priced.filter((p) => p.currentValue > 0).length,
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
```

The `walletUsd` / `walletNgn` fields are removed from the `portfolio:` shape.

- [ ] **Step 5.6: Run tests**

```bash
npx jest src/modules/risk/risk.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5.7: Commit**

```bash
git add apps/server/src/modules/risk/risk.service.ts apps/server/src/modules/risk/risk.service.spec.ts
git commit -m "feat(risk): evaluate paper holdings via Gemini, persist reasoningPath+anomalies"
```

---

## Task 6: Delete /risk/analyze, update /risk/simulate

**Files:**
- Modify: `apps/server/src/modules/gemini/gemini.controller.ts`

- [ ] **Step 6.1: Remove `analyzePortfolioRisk` endpoint**

In `apps/server/src/modules/gemini/gemini.controller.ts`, delete the entire `@Post('analyze') analyzePortfolioRisk(...)` method. The `/risk/evaluate` endpoint in `RiskController` is now the canonical risk path.

- [ ] **Step 6.2: Update `/risk/simulate` to take `holdingId`**

Replace the `simulateRiskChange` method body with:

```ts
@Post('simulate')
@UseGuards(JwtGuard)
async simulateRiskChange(
  @Request() req,
  @Body() body: { holdingId: string; newPrice: number },
) {
  const holding = await this.portfolioService.findHoldingForUser(req.user.id, body.holdingId);
  if (!holding) {
    throw new NotFoundException('Holding not found');
  }

  const portfolio = await this.portfolioService.getPortfolioWithLivePrices(
    holding.portfolioId,
    req.user.id,
  );

  const holdingsData = portfolio.holdings.map((h) => ({
    symbol: h.eventTitle ?? h.symbol,
    quantity: h.quantity,
    currentPrice: h.id === body.holdingId ? body.newPrice : (h.currentPrice ?? 0),
    change24h: 0,
    value: (h.id === body.holdingId ? body.newPrice : (h.currentPrice ?? 0)) * h.quantity,
  }));

  return this.geminiService.simulateRiskChange(holdingsData, {
    symbol: holding.eventTitle ?? holding.symbol,
    newPrice: body.newPrice,
  });
}
```

- [ ] **Step 6.3: Add `findHoldingForUser` helper to PortfolioService**

In `apps/server/src/modules/portfolio/portfolio.service.ts`, add this method below `removeHolding`:

```ts
async findHoldingForUser(userId: string, holdingId: string) {
  return this.db.holdings.findFirst({
    where: {
      id: holdingId,
      portfolio: { userId },
    },
  });
}
```

- [ ] **Step 6.4: Verify the server builds**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "(gemini|portfolio|risk|bayse)" | grep -v "node_modules"
```

Expected: no errors in those modules. Pre-existing errors in unrelated files are ok.

- [ ] **Step 6.5: Commit**

```bash
git add apps/server/src/modules/gemini/gemini.controller.ts apps/server/src/modules/portfolio/portfolio.service.ts
git commit -m "chore(risk): drop redundant /risk/analyze, retarget /risk/simulate by holdingId"
```

---

## Task 7: Frontend types — Holding, Portfolio, RiskScore

**Files:**
- Modify: `apps/web/app/_lib/types.ts`

- [ ] **Step 7.1: Update `Holding` interface**

In `apps/web/app/_lib/types.ts`, replace the `Holding` interface:

```ts
export interface Holding {
  id: string;
  symbol: string;          // Bayse eventId
  eventTitle: string;      // now required from server
  outcome: Outcome;        // now required from server
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  currentValue: number | null;
  costBasis: number;
  pnl: number | null;
  pnlPercent: number | null;
  payoutIfWins: number;
  isLive: boolean;
  isStale: boolean;
  portfolioId?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

- [ ] **Step 7.2: Update `Portfolio` interface — drop wallet, add P&L totals**

In the same file, replace the `Portfolio` interface:

```ts
export interface Portfolio {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  holdings?: Holding[];
  totalValue?: number;
  totalCost?: number;
  totalPnl?: number;
  totalPnlPercent?: number;
  openPositions?: number;
  lastUpdated?: string;
}
```

- [ ] **Step 7.3: Drop the `Wallet` interface**

Delete the `WalletAsset` and `Wallet` interfaces (the last block in the file). They are now unused.

- [ ] **Step 7.4: Commit**

```bash
git add apps/web/app/_lib/types.ts
git commit -m "feat(types): paper-trading Holding/Portfolio shape; drop Wallet"
```

---

## Task 8: Frontend API client + queries — drop wallet, add outcome

**Files:**
- Modify: `apps/web/app/_lib/portfolio-api.ts`
- Modify: `apps/web/app/_lib/queries.ts`

- [ ] **Step 8.1: Update `addHolding` API client signature**

In `apps/web/app/_lib/portfolio-api.ts`, replace the `addHolding` function:

```ts
export async function addHolding(
  portfolioId: string,
  input: { eventId: string; outcome: 'YES' | 'NO'; quantity: number }
): Promise<Holding> {
  const res = await apiFetch<ApiEnvelope<Holding> | Holding>(
    `/portfolio/${portfolioId}/holdings`,
    {
      method: 'POST',
      json: { symbol: input.eventId, outcome: input.outcome, quantity: input.quantity },
    }
  );
  return unwrap<Holding>(res);
}
```

- [ ] **Step 8.2: Delete `getWallet`**

In the same file, delete the entire `getWallet()` function and remove `Wallet` from the imports at the top.

- [ ] **Step 8.3: Update `useAddHolding` and drop `useWallet` in queries.ts**

In `apps/web/app/_lib/queries.ts`:

1. Remove `getWallet` and `Wallet` from imports.
2. Remove the `wallet` entries from `qk` and `STALE`.
3. Delete the entire `useWallet` hook.
4. Replace the `useAddHolding` hook's mutationFn:

```ts
export function useAddHolding(portfolioId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { eventId: string; outcome: 'YES' | 'NO'; quantity: number }) =>
      addHolding(portfolioId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.portfolio(portfolioId) });
      qc.invalidateQueries({ queryKey: qk.portfolios });
      qc.invalidateQueries({ queryKey: qk.riskSummary(portfolioId) });
    },
  });
}
```

- [ ] **Step 8.4: Verify no TS errors**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only in files that consume `Wallet` or `useWallet` (we'll handle those next) or files whose `addHolding` callsites need the new shape. Note the file paths.

- [ ] **Step 8.5: Commit**

```bash
git add apps/web/app/_lib/portfolio-api.ts apps/web/app/_lib/queries.ts
git commit -m "feat(api-client): outcome on addHolding; drop wallet client"
```

---

## Task 9: Add Holding modal — YES/NO toggle + EST. COST

**Files:**
- Modify: `apps/web/app/(dashboard)/_components/add-holding-modal.tsx`

- [ ] **Step 9.1: Add outcome state + UI toggle**

In `apps/web/app/(dashboard)/_components/add-holding-modal.tsx`, after `const [quantity, setQuantity] = useState("");` add:

```tsx
const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');

// Default-select the higher-prob side whenever a market is picked
useEffect(() => {
  if (selected) {
    setOutcome(selected.yesPrice >= selected.noPrice ? 'YES' : 'NO');
  }
}, [selected]);
```

Add `useEffect` to the React imports at the top.

- [ ] **Step 9.2: Update reset and submit handlers**

Replace `reset` and `handleSubmit`:

```tsx
function reset() {
  setQuery("");
  setSelected(null);
  setQuantity("");
  setOutcome('YES');
  addHolding.reset();
}

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const qty = Number(quantity);
  if (!selected || !Number.isFinite(qty) || qty <= 0 || addHolding.isPending) return;
  try {
    await addHolding.mutateAsync({ eventId: selected.eventId, outcome, quantity: qty });
    reset();
    onClose();
  } catch {
    /* surfaced via mutation state */
  }
}
```

- [ ] **Step 9.3: Add the YES/NO segmented control + EST. COST line**

Inside the `<form>`, between the selected-market block and the SHARES input, add (only render when `selected` is non-null):

```tsx
{selected ? (
  <>
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => setOutcome('YES')}
        className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-colors ${
          outcome === 'YES'
            ? 'border-primary/60 bg-primary/[0.10] text-foreground'
            : 'border-black/[0.08] bg-white text-foreground/70 hover:bg-black/[0.03]'
        }`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">YES</span>
        <span className="text-sm font-semibold tabular-nums">
          {(selected.yesPrice * 100).toFixed(0)}¢
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOutcome('NO')}
        className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-colors ${
          outcome === 'NO'
            ? 'border-primary/60 bg-primary/[0.10] text-foreground'
            : 'border-black/[0.08] bg-white text-foreground/70 hover:bg-black/[0.03]'
        }`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/55">NO</span>
        <span className="text-sm font-semibold tabular-nums">
          {(selected.noPrice * 100).toFixed(0)}¢
        </span>
      </button>
    </div>
  </>
) : null}
```

After the SHARES `<label>` block, add the EST. COST line:

```tsx
{selected && Number(quantity) > 0 ? (
  <div className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-black/[0.02] px-4 py-2.5 text-xs">
    <span className="font-medium uppercase tracking-wider text-foreground/55">Est. cost</span>
    <span className="font-semibold tabular-nums text-foreground">
      {(Number(quantity) * (outcome === 'YES' ? selected.yesPrice : selected.noPrice)).toLocaleString(undefined, {
        style: 'currency', currency: 'USD', maximumFractionDigits: 2,
      })}
    </span>
  </div>
) : null}
```

- [ ] **Step 9.4: Verify the modal renders**

Run from `apps/web/`:

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`, click "Add holding", search a market, pick one. Expected: YES/NO buttons render with correct prices, default-select higher-prob side, EST. COST updates as quantity changes.

Stop the dev server (Ctrl+C).

- [ ] **Step 9.5: Commit**

```bash
git add apps/web/app/(dashboard)/_components/add-holding-modal.tsx
git commit -m "feat(holding-modal): YES/NO toggle and live EST. COST"
```

---

## Task 10: Holdings list — show entry → current + neutral outcome chip

**Files:**
- Modify: `apps/web/app/(dashboard)/_components/holdings-list.tsx`

- [ ] **Step 10.1: Update the per-holding row to show entry → current + P&L**

In `apps/web/app/(dashboard)/_components/holdings-list.tsx`, replace the inner content of the `<li>` (the part that currently only shows `currentValue` and `percentageChange`) with:

```tsx
<li
  key={h.id}
  className="group flex items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-black/[0.015]"
>
  <div
    className="flex size-9 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-primary-foreground"
    style={{ background: SYMBOL_COLORS[i % SYMBOL_COLORS.length] }}
  >
    {initials}
  </div>
  <div className="min-w-0 flex-1">
    <div className="truncate text-sm font-semibold text-foreground">{label}</div>
    <div className="flex items-center gap-1.5 text-xs text-foreground/50">
      <span className="rounded bg-black/[0.05] px-1 py-0.5 text-[9px] font-bold text-foreground/70">
        {h.outcome}
      </span>
      <span>{formatQty(h.quantity)} shares</span>
      <span className="tabular-nums">
        @ {(h.entryPrice * 100).toFixed(0)}¢
      </span>
      {typeof h.currentPrice === 'number' ? (
        <span className="tabular-nums text-foreground/70">
          → {(h.currentPrice * 100).toFixed(0)}¢
        </span>
      ) : (
        <span className="text-amber-700">— stale</span>
      )}
    </div>
  </div>
  {typeof h.currentValue === 'number' ? (
    <div className="flex flex-col items-end text-right">
      <span className="text-xs font-semibold text-foreground tabular-nums">
        {formatUsd(h.currentValue)}
      </span>
      {typeof h.pnl === 'number' && h.costBasis > 0 ? (
        <span
          className={`text-[10px] font-medium tabular-nums ${
            h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {h.pnl >= 0 ? '+' : ''}
          {formatUsd(h.pnl)} ({h.pnlPercent!.toFixed(1)}%)
        </span>
      ) : null}
    </div>
  ) : null}
  <button
    type="button"
    onClick={() => deleteHolding.mutate(h.id)}
    disabled={isDeleting}
    aria-label={`Remove ${h.symbol}`}
    className="flex size-7 cursor-pointer items-center justify-center rounded-full text-foreground/40 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
  >
    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
  </button>
</li>
```

Also update the `formatUsd` helper to keep two fraction digits since paper P&L is sub-dollar:

```tsx
function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}
```

- [ ] **Step 10.2: Visual sanity check**

Run `npm run dev`, log in, view a portfolio with at least one holding (add a fresh one if needed). Expected: outcome chip is neutral grey, shares row shows "23 shares @ 51¢ → 53¢", P&L chip green/red.

- [ ] **Step 10.3: Commit**

```bash
git add apps/web/app/(dashboard)/_components/holdings-list.tsx
git commit -m "feat(holdings-list): entry→current price, neutral outcome chip, P&L"
```

---

## Task 11: Dashboard risk panel — render reasoningPath + anomalies

**Files:**
- Verify: `apps/web/app/(dashboard)/dashboard/page.tsx`

The dashboard already reads `summary?.risk?.reasoningPath` ([dashboard/page.tsx:88]). Once Task 5 lands, that field will contain Gemini's actual reasoning. This task confirms the rendering and adds an anomalies block if missing.

- [ ] **Step 11.1: Read the existing risk-rendering block**

Open `apps/web/app/(dashboard)/dashboard/page.tsx`, find the section that uses `reasoning`. Confirm it renders an ordered list. If it does, leave it alone.

- [ ] **Step 11.2: Add anomalies rendering if missing**

If there is no UI block reading `summary?.risk?.anomalies`, add one near the reasoning block:

```tsx
{summary?.risk?.anomalies && summary.risk.anomalies.length > 0 ? (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
      Anomalies detected
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      {summary.risk.anomalies.map((a, idx) => (
        <span
          key={idx}
          className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800"
        >
          {a}
        </span>
      ))}
    </div>
  </div>
) : null}
```

- [ ] **Step 11.3: Visual sanity check**

`npm run dev`, click Evaluate Risk on a portfolio with holdings. Expected: 4–8s spinner → reasoning steps and anomalies render.

- [ ] **Step 11.4: Commit (only if changes were made)**

```bash
git add apps/web/app/(dashboard)/dashboard/page.tsx
git commit -m "feat(dashboard): render Gemini reasoning path + anomalies"
```

---

## Task 12: End-to-end manual verification

No code changes — this is the demo-readiness gate.

- [ ] **Step 12.1: Start the stack**

```bash
# Terminal 1 — server
cd apps/server && npm run start:dev

# Terminal 2 — web
cd apps/web && npm run dev
```

- [ ] **Step 12.2: Run the golden-path checklist**

1. Login → portfolios list renders.
2. Create portfolio → empty state renders cleanly (no zeros, no NaN).
3. Search a market in the Add Holding modal → results appear.
4. Pick a market → YES/NO buttons render, EST. COST live-updates as you type a quantity.
5. Submit "23 shares YES" → modal closes, holding appears with real entry price + current price + outcome chip.
6. Refresh portfolio detail page (within 30s) → loads <100ms.
7. Click Evaluate Risk → 4–8s spinner → score, explanation, reasoning steps, anomalies all render.
8. Re-click Evaluate Risk → instant (snapshot cache).
9. Add a second holding (different market or same market opposite side) → portfolio totals update correctly.

- [ ] **Step 12.3: Smoke-test the gated production endpoint**

```bash
curl -i -X POST https://synthsentry.up.railway.app/risk/test \
  -H "x-test-secret: $RISK_TEST_SECRET"
```

Expected: 201 with risk-analysis JSON. Confirms Gemini wiring still works in production after the deploy.

- [ ] **Step 12.4: If any step in 12.2 glitches**

Stop here. Open the offending file. Fix in place. Add a regression test if the bug was a logic error. Re-run the checklist. Commit:

```bash
git add <fixed-files>
git commit -m "fix: <specific issue from manual sweep>"
```

- [ ] **Step 12.5: Final commit (release marker)**

If no issues, tag the work:

```bash
git tag -a paper-trading-portfolio-v1 -m "Paper trading portfolio: end-to-end clean"
```

---

## Out-of-scope reminders (do NOT implement)

- Paper-cash wallet ("you have $10K to spend")
- Sell flow
- WebSocket live-price push
- Per-lot trade history
- Real Bayse brokerage integration

These are deliberate cuts per the design spec.
