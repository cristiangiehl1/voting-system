/*
  Warnings:

  - You are about to drop the column `avatar` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `rankingId` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `Vote` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Achievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ranking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAchievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoteLabel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `listId` to the `Candidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/

-- DropForeignKey (already dropped by previous failed run)
-- Skipping: Account_userId_fkey, Candidate_rankingId_fkey, Ranking_createdById_fkey,
-- Session_userId_fkey, UserAchievement_*_fkey, UserStats_userId_fkey, VoteLabel_*_fkey

-- Create VotingList table before altering Candidate (needed for FK reference)
CREATE TABLE "VotingList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "VotingList_pkey" PRIMARY KEY ("id")
);

-- Migrate data from Ranking to VotingList
INSERT INTO "VotingList" ("id", "name", "description", "createdAt", "updatedAt", "createdById", "expiresAt")
SELECT "id", "name", "description", "createdAt", "createdAt", "createdById", NULL
FROM "Ranking";

-- Create Participant table
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_userId_listId_key" ON "Participant"("userId", "listId");

-- AlterTable: add listId as nullable, populate, then set NOT NULL
ALTER TABLE "Candidate" DROP COLUMN "avatar",
DROP COLUMN "email",
DROP COLUMN "rankingId",
ADD COLUMN "description" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "listId" TEXT;

UPDATE "Candidate" SET "listId" = (SELECT id FROM "VotingList" LIMIT 1);

ALTER TABLE "Candidate" ALTER COLUMN "listId" SET NOT NULL;

-- AlterTable: add updatedAt as nullable, populate, then set NOT NULL
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "image",
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "User" SET "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "comment";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Achievement";

-- DropTable
DROP TABLE "Label";

-- DropTable
DROP TABLE "Ranking";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "UserAchievement";

-- DropTable
DROP TABLE "UserStats";

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "VoteLabel";

-- AddForeignKey
ALTER TABLE "VotingList" ADD CONSTRAINT "VotingList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_listId_fkey" FOREIGN KEY ("listId") REFERENCES "VotingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_listId_fkey" FOREIGN KEY ("listId") REFERENCES "VotingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
