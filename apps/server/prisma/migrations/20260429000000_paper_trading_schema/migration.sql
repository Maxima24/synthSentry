/*
  Paper trading schema migration.

  Holdings: capture YES/NO outcome, eventTitle, marketId at add-time, plus
  weighted-avg entryPrice. Unique key now includes outcome so a user can
  hold both YES and NO of the same market as separate paper positions.

  RiskSnapShots: persist Gemini's reasoningPath and anomalies on each
  snapshot for accurate point-in-time history.

  This is a clean-slate migration: existing Holdings/RiskSnapShots rows
  are test data and are truncated so the new NOT NULL columns can be
  added without backfill.
*/

-- Clean slate (test data only)
TRUNCATE TABLE "Holdings" CASCADE;
TRUNCATE TABLE "RiskSnapShots" CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "Holdings_symbol_portfolioId_key";

-- AlterTable: Holdings — make required, add entryPrice
ALTER TABLE "Holdings"
  ALTER COLUMN "eventTitle" SET NOT NULL,
  ALTER COLUMN "marketId" SET NOT NULL,
  ALTER COLUMN "outcome" SET NOT NULL,
  ADD COLUMN "entryPrice" DECIMAL(65,30) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Holdings_symbol_outcome_portfolioId_key" ON "Holdings"("symbol", "outcome", "portfolioId");

-- AlterTable: RiskSnapShots — add reasoningPath, anomalies
ALTER TABLE "RiskSnapShots"
  ADD COLUMN "reasoningPath" JSONB NOT NULL,
  ADD COLUMN "anomalies" JSONB NOT NULL;
