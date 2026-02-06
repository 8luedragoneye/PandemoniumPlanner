-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "massupTime" DATETIME,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recruiting',
    "type" TEXT NOT NULL DEFAULT 'regular',
    "activityTypes" TEXT NOT NULL DEFAULT '[]',
    "zone" TEXT,
    "minEquip" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "activities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_activities" ("createdAt", "creatorId", "date", "description", "id", "massupTime", "minEquip", "name", "status", "type", "updatedAt", "zone") SELECT "createdAt", "creatorId", "date", "description", "id", "massupTime", "minEquip", "name", "status", "type", "updatedAt", "zone" FROM "activities";
DROP TABLE "activities";
ALTER TABLE "new_activities" RENAME TO "activities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
