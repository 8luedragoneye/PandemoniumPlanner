-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- Create new table structure with massupTime, minEquip (replacing minIP), and without minFame
CREATE TABLE "activities_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "massupTime" DATETIME,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recruiting',
    "zone" TEXT,
    "minEquip" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "activities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table to new table (convert minIP to minEquip if needed)
INSERT INTO "activities_new" ("id", "name", "date", "massupTime", "description", "status", "zone", "minEquip", "creatorId", "createdAt", "updatedAt")
SELECT 
    "id",
    "name",
    "date",
    NULL as "massupTime",
    "description",
    "status",
    "zone",
    CASE 
        WHEN "minIP" IS NOT NULL THEN 'T' || CAST(("minIP" / 100) AS TEXT)
        ELSE NULL
    END as "minEquip",
    "creatorId",
    "createdAt",
    "updatedAt"
FROM "activities";

-- Drop old table
DROP TABLE "activities";

-- Rename new table
ALTER TABLE "activities_new" RENAME TO "activities";
