-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "rank" INTEGER;

-- AlterTable
ALTER TABLE "VotingList" ADD COLUMN     "maxRank" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "rankedVoting" BOOLEAN NOT NULL DEFAULT false;
