/*
  Warnings:

  - You are about to drop the column `name` on the `Holdings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[holdingId]` on the table `AlertConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Portfolio_userId_key";

-- AlterTable
ALTER TABLE "AnomalyFlag" ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Holdings" DROP COLUMN "name",
ADD COLUMN     "eventTitle" TEXT,
ADD COLUMN     "marketId" TEXT,
ADD COLUMN     "outcome" TEXT;

-- AlterTable
ALTER TABLE "RiskSnapShots" ADD COLUMN     "riskLevel" TEXT NOT NULL DEFAULT 'low';

-- CreateIndex
CREATE UNIQUE INDEX "AlertConfig_holdingId_key" ON "AlertConfig"("holdingId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
