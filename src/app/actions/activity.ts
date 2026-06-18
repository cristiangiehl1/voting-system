"use server"

import { prisma } from "@/lib/prisma"

export async function getRecentActivity(rankingId: string) {
  const votes = await prisma.vote.findMany({
    where: { candidate: { rankingId } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      voter: { select: { name: true, image: true } },
      candidate: { select: { name: true } },
      voteLabels: { include: { label: { select: { name: true } } } },
    },
  })
  return votes
}
