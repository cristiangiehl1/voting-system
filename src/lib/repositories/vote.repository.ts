import { prisma } from "@/lib/prisma"

export async function findVotesByVoterAndList(voterId: string, listId: string) {
  return prisma.vote.findMany({
    where: {
      voterId,
      option: { listId },
    },
    select: { optionId: true, rank: true },
  })
}

export async function findVoteByVoterAndOption(voterId: string, optionId: string) {
  return prisma.vote.findUnique({
    where: { voterId_optionId: { voterId, optionId } },
  })
}

export async function countVotesByVoterAndList(voterId: string, listId: string) {
  return prisma.vote.count({
    where: {
      voterId,
      option: { listId },
    },
  })
}

export async function createVote(voterId: string, optionId: string, rank?: number) {
  return prisma.vote.create({
    data: { voterId, optionId, rank },
  })
}

export async function deleteVotesByVoterAndOption(voterId: string, optionId: string) {
  return prisma.vote.deleteMany({
    where: { voterId, optionId },
  })
}

export async function deleteVotesByVoterAndList(voterId: string, listId: string) {
  return prisma.vote.deleteMany({
    where: {
      voterId,
      option: { listId },
    },
  })
}

export async function getResultsByListId(listId: string, rankedVoting?: boolean, maxRank?: number, includeVoterInfo = false) {
  const options = await prisma.option.findMany({
    where: { listId },
    include: {
      _count: { select: { votes: true } },
      ...(rankedVoting || includeVoterInfo
        ? {
            votes: {
              ...(includeVoterInfo
                ? { include: { voter: { select: { name: true } } } }
                : { select: { rank: true } }),
              orderBy: { createdAt: "desc" },
            },
          }
        : {}),
    },
  })

  if (rankedVoting && maxRank) {
    const pointsMap = new Map<string, number>()
    for (const option of options) {
      let points = 0
      for (const vote of option.votes) {
        if (vote.rank != null) {
          points += maxRank + 1 - vote.rank
        }
      }
      pointsMap.set(option.id, points)
    }

    return options
      .map((o) => ({ ...o, totalVotes: pointsMap.get(o.id) ?? 0 }))
      .sort((a, b) => b.totalVotes - a.totalVotes)
  }

  return options
    .map((o) => ({ ...o, totalVotes: o._count.votes }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
}
