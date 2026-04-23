/*
  Warnings:

  - The `outcome` column on the `Holdings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('YES', 'NO');

-- AlterTable
ALTER TABLE "Holdings" DROP COLUMN "outcome",
ADD COLUMN     "outcome" "Outcome" NOT NULL DEFAULT 'NO';
