-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rungId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "durationSec" INTEGER,
    "patternGuess" TEXT,
    "notes" TEXT,
    "debtDueAt" TIMESTAMP(3),
    "debtClearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rungId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "guess" TEXT,
    "correct" BOOLEAN NOT NULL,
    "seconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeAttempt_userId_rungId_createdAt_idx" ON "PracticeAttempt"("userId", "rungId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeAttempt_userId_slug_idx" ON "PracticeAttempt"("userId", "slug");

-- CreateIndex
CREATE INDEX "PracticeAttempt_userId_debtDueAt_idx" ON "PracticeAttempt"("userId", "debtDueAt");

-- CreateIndex
CREATE INDEX "DiagnosticItem_userId_pattern_createdAt_idx" ON "DiagnosticItem"("userId", "pattern", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticItem_userId_runId_idx" ON "DiagnosticItem"("userId", "runId");

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticItem" ADD CONSTRAINT "DiagnosticItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
