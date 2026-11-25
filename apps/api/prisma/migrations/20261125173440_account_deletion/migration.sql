-- CreateTable
CREATE TABLE "AccountDeletion" (
    "id" BIGSERIAL NOT NULL,
    "deletedOn" DATE NOT NULL,

    CONSTRAINT "AccountDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountDeletion_deletedOn_idx" ON "AccountDeletion"("deletedOn");
