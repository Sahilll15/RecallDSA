-- AlterTable
ALTER TABLE "Revision" ADD COLUMN     "lastSolveCredit" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'recall';

-- CreateIndex
CREATE INDEX "Attempt_userId_source_createdAt_idx" ON "Attempt"("userId", "source", "createdAt");
