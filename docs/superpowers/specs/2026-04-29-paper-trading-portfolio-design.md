# Paper-Trading Portfolio — End-to-End Design

**Date:** 2026-04-29
**Context:** SynthSentry hackathon submission. Portfolio + AI risk-analysis flows are wired against the user's real Bayse brokerage account but the user has no real Bayse positions, so every screen renders zeros and `/risk/evaluate` short-circuits with `400 "No open positions found on Bayse"`.

This design pivots the entire holdings/risk surface to **paper trading**: holdings live in our DB, mark-to-market uses Bayse as public market data only, and risk evaluation reads from the user's saved holdings.

## Goals

1. **Add Holding** captures everything needed for honest paper P&L: outcome (YES/NO), entry price, event title, market id.
2. **Portfolio detail** shows real numbers — current price, current value, cost basis, P&L per holding and at the portfolio level.
3. **Evaluate Risk** runs end-to-end against the user's DB holdings, surfaces Gemini's `reasoningPath` and `anomalies` to the UI, and persists them on the snapshot for history.
4. **Demo path is bulletproof**: a single slow Bayse call must not blank the screen, repeated views are instant, empty states render cleanly.

## Non-goals (deliberate cuts)

- Paper-cash wallet ("you have $10K to spend"). New schema, debit/credit logic, "insufficient funds" UX. Not on demo path.
- Sell flow. Demo path is buy → P&L → risk.
- WebSocket live-price push. Polling on page open is enough; live connections are a demo liability.
- Per-lot trade history. Weighted-average per (event, side) covers the demo.
- Real Bayse brokerage integration. Cleanly cut; can be re-added in a future redesign.

## Schema

### `Holdings` — make incomplete columns required, add `entryPrice`

```prisma
model Holdings {
  id          String   @id @default(uuid())
  symbol      String   // Bayse eventId
  eventTitle  String   // CHANGED: nullable → required, captured at add-time
  marketId    String   // CHANGED: nullable → required, captured at add-time
  outcome     String   // CHANGED: nullable → required, "YES" | "NO"
  entryPrice  Decimal  // NEW: weighted-avg implied probability paid in (0.00–1.00)
  quantity    Decimal
  portfolioId String
  portfolio   Portfolio     @relation(references: [id], fields: [portfolioId], onDelete: Cascade)
  alerts      AlertConfig[]
  anomalies   AnomalyFlag[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([symbol, outcome, portfolioId])  // CHANGED: was [symbol, portfolioId]
}
```

**Migration:** drops existing `Holdings` rows (test data only) and re-adds the columns as `NOT NULL`. Clean slate per user direction.

### `RiskSnapShots` — capture Gemini's full output

```prisma
model RiskSnapShots {
  id            String    @id @default(uuid())
  portfolioId   String
  portfolio     Portfolio @relation(fields: [portfolioId], references: [id])
  overallScore  Int
  riskLevel     String    @default("low")
  explanation   String
  reasoningPath Json      // NEW: Gemini's step-by-step (was discarded)
  anomalies     Json      // NEW: Gemini's flagged anomalies for this snapshot
  holdingScores Json
  snapShotAt    DateTime  @default(now())
}
```

`AnomalyFlag` table stays for active alerts — separate concern from per-snapshot anomalies.

## Backend

### `AddHoldingDto` (portfolio module)

```ts
export class AddHoldingDto {
  @IsUUID()                       symbol!: string;        // Bayse eventId
  @IsIn(['YES', 'NO'])            outcome!: 'YES' | 'NO'; // NEW
  @IsNumber() @Min(1)             quantity!: number;
}
```

The client does not send `entryPrice` or `eventTitle` — server fetches them from Bayse to prevent client-side fakery.

### `addHolding` (portfolio.service.ts)

```
addHolding(userId, portfolioId, dto):
  1. Verify portfolio belongs to user (404 otherwise).
  2. event = await bayse.getEvent(dto.symbol)  // 400 if invalid
  3. priceNow  = dto.outcome === 'YES' ? event.yesPrice : event.noPrice
     marketId  = event.marketId
  4. Upsert on [symbol, outcome, portfolioId]:
       create:  { symbol, outcome, eventTitle: event.title, marketId,
                  entryPrice: priceNow, quantity: dto.quantity }
       update:  newQty   = oldQty + dto.quantity
                newAvg   = (oldQty*oldPrice + dto.quantity*priceNow) / newQty
                set { quantity: newQty, entryPrice: newAvg }
```

### `getPortfolioWithLivePrices` (portfolio.service.ts) — full rewrite

```
getPortfolioWithLivePrices(portfolioId, userId):
  1. portfolio = db.portfolio.findFirst({ id, userId, include: { holdings: true } })
     404 if not found.
  2. parallel allSettled per holding (with 30s in-memory cache):
       cached  = eventCache.get(symbol)
       event   = cached ?? await raceWithTimeout(bayse.getEvent(symbol), 2000ms)
       eventCache.set(symbol, event, ttl: 30s)

  // The 30s `eventCache` is a private `Map<eventId, { value, expiresAt }>` on
  // BayseService, so both `getPortfolioWithLivePrices` and `evaluatePortfolioRisk`
  // share the same cached event lookups within the 30s window.
  3. Per holding derive:
       currentPrice    = outcome==='YES' ? event.yesPrice : event.noPrice  (null on failure)
       currentValue    = currentPrice * quantity                           (null on failure)
       costBasis       = entryPrice * quantity
       pnl             = currentValue - costBasis                          (null on failure)
       pnlPercent      = (pnl / costBasis) * 100                           (null on failure)
       payoutIfWins    = quantity * 1.00
       isLive          = event?.status === 'open'
       isStale         = event === null
  4. Portfolio totals:
       totalValue, totalCost, totalPnl, totalPnlPercent (sums; null-safe)
  5. Response shape — NO wallet field:
       { id, name, holdings, totalValue, totalCost, totalPnl, totalPnlPercent,
         openPositions, lastUpdated }
```

### `evaluatePortfolioRisk` (risk.service.ts) — full rewrite

```
evaluatePortfolioRisk(dto, userId):
  1. portfolio = db.portfolio.findFirst({ id, userId, include: holdings })
     404 if not found.
  2. Cache: recent snapshot (<5min) and !forceRefresh → return cached.
  3. Empty portfolio (holdings.length === 0) → return emptyRiskScore() with friendly message.
     DO NOT throw 400. Empty portfolio is a valid state.
  4. priced = parallel allSettled per holding (reuse eventCache):
       event       = await bayse.getEvent(symbol)        [2s timeout]
       currentPrice= outcome==='YES' ? event.yesPrice : event.noPrice
       change24h   = await bayse.getMarketTicker(marketId, outcome).catch(() => 0)
       → HoldingData { symbol: shortLabel(eventTitle),
                       quantity, currentPrice, change24h,
                       value: currentPrice * quantity }
  5. If all priced calls failed:
       throw 503 "Market data temporarily unavailable"
       (better than feeding Gemini stale-only data)
  6. geminiAnalysis = await gemini.analyzePortfolioRisk(priced, totalValue)
  7. snapshot = db.riskSnapShots.create({
       portfolioId,
       overallScore:  geminiAnalysis.overallScore,
       riskLevel:     getRiskLevel(overallScore),
       explanation:   geminiAnalysis.explanation,
       reasoningPath: geminiAnalysis.reasoningPath,
       anomalies:     geminiAnalysis.anomalies,
       holdingScores: { eventId → score, ... },
     })
  8. checkAndTriggerAlerts(portfolioId, overallScore)
  9. return formatRiskScore(snapshot)
```

`formatRiskScore` is fixed to read `reasoningPath` and `anomalies` from the snapshot rather than returning hardcoded empty arrays.

### Code deleted

- `bayse.analysePortfolioRisk()` call inside `evaluatePortfolioRisk` (rule-based real-account risk).
- `mergedAnomalies` (was merging Gemini + rule-based).
- `bayse.getPortfolio()` call inside `evaluatePortfolioRisk`.
- `400 "No open positions found on Bayse to evaluate"`.
- `/risk/analyze` endpoint in `gemini.controller.ts` — redundant with `/risk/evaluate`. One canonical risk endpoint.
- All references to `wallet.usd` / `wallet.ngn` in service responses (also removed from `getPortfolioRiskSummary`).

### Code kept

- `/risk/test` (smoke test, gated by `RISK_TEST_SECRET`).
- `/risk/simulate` (price-change what-if). Updated DTO: takes `holdingId` instead of bare `symbol` so YES/NO is unambiguous.
- `/risk/history`, `/risk/summary`, `/risk/anomalies`, `/risk/alerts` — minor edits to `summary` to drop wallet/getPortfolio coupling.

## Frontend

### Add Holding modal

- YES/NO segmented toggle below the market title. Default-selected to whichever side has the higher implied probability.
- **EST. COST** line: `qty × selected_side_price`, live-updating.
- POST body: `{ symbol, outcome, quantity }`.

### Portfolio detail card

- Per-holding row: real `eventTitle`, **outcome chip (neutral colors — YES/NO is just the side, not a value judgement)**, `quantity`, `entryPrice → currentPrice`, **P&L chip colored by gain/loss** (green if `pnl > 0`, red if `pnl < 0`, neutral if 0 or null), payout-if-wins, "live" / "stale" indicator.
- Portfolio header: **Total Value | Total Cost | Total P&L** (no wallet panel).
- Empty state: "No holdings yet — search a market and add one to begin paper trading."

### Risk panel

- Score gauge (existing, unchanged).
- **Reasoning path**: expandable section with the 5 numbered steps Gemini returned.
- **Anomalies**: chip row, each chip a flagged anomaly text.
- **Per-holding scores**: small badge inside each holding row on the portfolio detail page (looked up by eventId from `holdingScores` on the latest snapshot).
- Empty-portfolio state: friendly card explaining "Add holdings to enable AI risk analysis." No error.

### Wallet UI removal

`grep` frontend for `wallet.usd` / `wallet.ngn` references. Per component, either:

- Delete (if only showed wallet),
- OR repurpose to show Total Cost / Total P&L.

## Success criteria — the demo golden path

All of the following must run without a glitch:

1. Login → portfolios list.
2. Create portfolio → detail page renders empty state cleanly.
3. Search market → results list.
4. Add holding → modal with working YES/NO toggle, EST. COST live-updates, submit succeeds and detail page renders with real price/cost basis.
5. Refresh portfolio → cached `getEvent` makes it <100ms.
6. Click Evaluate Risk → 4–8s loading → score + explanation + reasoning path + anomalies.
7. Re-click Evaluate Risk → instant (5-min snapshot cache).
8. Add second holding → portfolio totals update correctly.
9. (Stretch) Click Simulate → new score.

## Test plan

- Manual end-to-end sweep through steps 1–8 before submission.
- Service-level happy-path tests:
  - `addHolding` weighted-avg math when adding a second lot to the same (event, outcome).
  - `evaluatePortfolioRisk` builds `HoldingData[]` from DB and calls Gemini with non-zero values.
  - `getPortfolioWithLivePrices` returns `null`-priced holdings on Bayse failure rather than throwing.
- `/risk/test` endpoint (already gated by `RISK_TEST_SECRET`) remains the production smoke test.
