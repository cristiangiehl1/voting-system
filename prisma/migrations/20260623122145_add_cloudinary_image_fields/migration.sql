-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "imageId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "VotingList" ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "imageUrl" TEXT;
