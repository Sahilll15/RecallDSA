-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "pattern" TEXT;

-- AlterTable
ALTER TABLE "Revision" ADD COLUMN     "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "repetitions" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "intervalDays" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "RecallNote" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "keyIdea" TEXT,
    "approach" TEXT,
    "edgeCases" TEXT,
    "complexity" TEXT,
    "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecallNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "patternRecognized" BOOLEAN,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "concept" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mistake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecallNote_problemId_key" ON "RecallNote"("problemId");

-- CreateIndex
CREATE INDEX "Attempt_userId_problemId_idx" ON "Attempt"("userId", "problemId");

-- CreateIndex
CREATE INDEX "Attempt_userId_createdAt_idx" ON "Attempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Mistake_userId_idx" ON "Mistake"("userId");

-- CreateIndex
CREATE INDEX "Mistake_problemId_idx" ON "Mistake"("problemId");

-- CreateIndex
CREATE INDEX "Problem_pattern_idx" ON "Problem"("pattern");

-- AddForeignKey
ALTER TABLE "RecallNote" ADD CONSTRAINT "RecallNote_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
