-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- CreateTable
CREATE TABLE "premade_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'regular',
    "zone" TEXT,
    "minEquip" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "premade_activities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "premade_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "premadeActivityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slots" INTEGER NOT NULL,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "premade_roles_premadeActivityId_fkey" FOREIGN KEY ("premadeActivityId") REFERENCES "premade_activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
