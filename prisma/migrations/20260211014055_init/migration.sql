-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "massupTime" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recruiting',
    "type" TEXT NOT NULL DEFAULT 'regular',
    "activityTypes" TEXT NOT NULL DEFAULT '[]',
    "zone" TEXT,
    "minEquip" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slots" INTEGER NOT NULL,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signups" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_pairs" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fill_providers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providesSlots" BOOLEAN NOT NULL DEFAULT false,
    "providesWeight" BOOLEAN NOT NULL DEFAULT false,
    "slotOrigin" TEXT,
    "slotTarget" TEXT,
    "weightOrigin" TEXT,
    "weightTarget" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fill_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fill_assignments" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "fillType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fill_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fill_provider_points" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "activityId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fill_provider_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premade_activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'regular',
    "zone" TEXT,
    "minEquip" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premade_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premade_roles" (
    "id" TEXT NOT NULL,
    "premadeActivityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slots" INTEGER NOT NULL,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premade_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transport_pairs_activityId_fighterId_key" ON "transport_pairs"("activityId", "fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_pairs_activityId_transporterId_key" ON "transport_pairs"("activityId", "transporterId");

-- CreateIndex
CREATE UNIQUE INDEX "fill_providers_userId_key" ON "fill_providers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fill_assignments_activityId_pairId_providerId_fillType_key" ON "fill_assignments"("activityId", "pairId", "providerId", "fillType");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signups" ADD CONSTRAINT "signups_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signups" ADD CONSTRAINT "signups_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signups" ADD CONSTRAINT "signups_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_pairs" ADD CONSTRAINT "transport_pairs_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_pairs" ADD CONSTRAINT "transport_pairs_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "signups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_pairs" ADD CONSTRAINT "transport_pairs_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "signups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_providers" ADD CONSTRAINT "fill_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_assignments" ADD CONSTRAINT "fill_assignments_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_assignments" ADD CONSTRAINT "fill_assignments_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "transport_pairs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_assignments" ADD CONSTRAINT "fill_assignments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "fill_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_provider_points" ADD CONSTRAINT "fill_provider_points_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "fill_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_provider_points" ADD CONSTRAINT "fill_provider_points_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premade_activities" ADD CONSTRAINT "premade_activities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premade_roles" ADD CONSTRAINT "premade_roles_premadeActivityId_fkey" FOREIGN KEY ("premadeActivityId") REFERENCES "premade_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
