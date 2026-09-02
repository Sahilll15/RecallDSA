-- CreateTable
CREATE TABLE "RoadmapProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapProgress_userId_key" ON "RoadmapProgress"("userId");

-- AddForeignKey
ALTER TABLE "RoadmapProgress" ADD CONSTRAINT "RoadmapProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
