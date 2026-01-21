-- CreateTable
CREATE TABLE "fill_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "providesSlots" BOOLEAN NOT NULL DEFAULT false,
    "providesWeight" BOOLEAN NOT NULL DEFAULT false,
    "slotOrigin" TEXT,
    "slotTarget" TEXT,
    "weightOrigin" TEXT,
    "weightTarget" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fill_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fill_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "fillType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fill_assignments_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fill_assignments_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "transport_pairs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fill_assignments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "fill_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fill_provider_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "activityId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fill_provider_points_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "fill_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fill_provider_points_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "fill_providers_userId_key" ON "fill_providers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fill_assignments_activityId_pairId_providerId_fillType_key" ON "fill_assignments"("activityId", "pairId", "providerId", "fillType");
