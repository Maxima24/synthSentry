/*
  Warnings:

  - A unique constraint covering the columns `[symbol,portfolioId]` on the table `Holdings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Holdings_symbol_portfolioId_key" ON "Holdings"("symbol", "portfolioId");
