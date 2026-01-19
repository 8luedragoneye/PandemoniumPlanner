-- AlterTable
ALTER TABLE "activities" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'regular';

-- CreateTable
CREATE TABLE "transport_pairs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transport_pairs_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transport_pairs_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "signups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transport_pairs_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "signups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_pairs_activityId_fighterId_key" ON "transport_pairs"("activityId", "fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_pairs_activityId_transporterId_key" ON "transport_pairs"("activityId", "transporterId");
