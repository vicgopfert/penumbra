-- CreateEnum
CREATE TYPE "ProductEventKind" AS ENUM ('PAGE_VIEW', 'LIST_IMPRESSION', 'RECOMMENDATION_CLICK', 'WANT_TO_PLAY', 'EXIT_CLICK');

-- CreateEnum
CREATE TYPE "ProductPage" AS ENUM ('HOME', 'CATALOG', 'GAME', 'COLLECTIONS', 'COLLECTION', 'RECOMMENDATIONS', 'RECOMMENDATION_LIST', 'PROFILE', 'ONBOARDING', 'ACCOUNT', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "RecommendationListKind" AS ENUM ('MAIN', 'LIKED_GAME', 'INTEREST', 'UPCOMING', 'SIMILAR');

-- CreateEnum
CREATE TYPE "VisitOrigin" AS ENUM ('DIRECT', 'SEARCH', 'OTHER_SITE');

-- CreateEnum
CREATE TYPE "ExitKind" AS ENUM ('STORE', 'OFFICIAL_SITE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "usageMetricsConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProductEvent" (
    "id" BIGSERIAL NOT NULL,
    "kind" "ProductEventKind" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,
    "page" "ProductPage",
    "visitStart" BOOLEAN,
    "origin" "VisitOrigin",
    "gameId" UUID,
    "gameIds" UUID[],
    "list" "RecommendationListKind",
    "mode" "DiscoveryMode",
    "position" INTEGER,
    "listPage" INTEGER,
    "exit" "ExitKind",
    "store" "Store",

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductEvent_occurredAt_idx" ON "ProductEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "ProductEvent_userId_idx" ON "ProductEvent"("userId");

-- CreateIndex
CREATE INDEX "ProductEvent_gameId_idx" ON "ProductEvent"("gameId");

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
