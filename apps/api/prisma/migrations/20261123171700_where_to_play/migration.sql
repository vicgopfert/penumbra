-- CreateEnum
CREATE TYPE "Store" AS ENUM ('APP_STORE', 'EPIC', 'GOG', 'GOOGLE_PLAY', 'ITCH', 'MICROSOFT', 'NINTENDO', 'PLAYSTATION', 'STEAM');

-- CreateTable
CREATE TABLE "Platform" (
    "id" UUID NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlatform" (
    "gameId" UUID NOT NULL,
    "platformId" UUID NOT NULL,

    CONSTRAINT "GamePlatform_pkey" PRIMARY KEY ("gameId","platformId")
);

-- CreateTable
CREATE TABLE "GameStoreLink" (
    "gameId" UUID NOT NULL,
    "store" "Store" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "GameStoreLink_pkey" PRIMARY KEY ("gameId","store")
);

-- CreateIndex
CREATE UNIQUE INDEX "Platform_igdbId_key" ON "Platform"("igdbId");

-- CreateIndex
CREATE INDEX "GamePlatform_platformId_idx" ON "GamePlatform"("platformId");

-- AddForeignKey
ALTER TABLE "GamePlatform" ADD CONSTRAINT "GamePlatform_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlatform" ADD CONSTRAINT "GamePlatform_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameStoreLink" ADD CONSTRAINT "GameStoreLink_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
