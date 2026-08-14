-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "solvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Problem_solvedAt_idx" ON "Problem"("solvedAt");
