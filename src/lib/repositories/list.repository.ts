import { prisma } from "@/lib/prisma"

type ListWithCount = Array<{
  id: string
  name: string
  description: string | null
  imageId: string | null
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
  createdById: string
  expiresAt: Date | null
  revealVotes: boolean
  allowMultipleVotes: boolean
  rankedVoting: boolean
  maxRank: number
  _count: { options: number; participants: number }
  createdBy: { name: string | null; imageUrl: string | null }
}>

type SingleListWithCount = {
  id: string
  name: string
  description: string | null
  imageId: string | null
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
  createdById: string
  expiresAt: Date | null
  revealVotes: boolean
  allowMultipleVotes: boolean
  rankedVoting: boolean
  maxRank: number
  _count: { options: number; participants: number }
  createdBy: { name: string | null; email: string | null; imageUrl: string | null }
} | null

export async function findListsByUserId(userId: string): Promise<ListWithCount> {
  return prisma.votingList.findMany({
    where: {
      OR: [{ createdById: userId }, { participants: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { options: true, participants: true } },
      createdBy: { select: { name: true, imageUrl: true } },
    },
  }) as unknown as ListWithCount
}

export async function findListById(id: string): Promise<SingleListWithCount> {
  return prisma.votingList.findUnique({
    where: { id },
    include: {
      _count: { select: { options: true, participants: true } },
      createdBy: { select: { name: true, email: true, imageUrl: true } },
    },
  }) as unknown as SingleListWithCount
}

export async function createList(data: {
  name: string
  description?: string
  imageId?: string
  imageUrl?: string
  createdById: string
  expiresAt?: Date
  revealVotes?: boolean
  allowMultipleVotes?: boolean
  rankedVoting?: boolean
  maxRank?: number
}) {
  return prisma.votingList.create({ data })
}

export async function updateList(
  id: string,
  data: {
    name?: string
    description?: string
    imageId?: string | null
    imageUrl?: string | null
    expiresAt?: Date | null
    revealVotes?: boolean
    allowMultipleVotes?: boolean
    rankedVoting?: boolean
    maxRank?: number
  }
) {
  return prisma.votingList.update({ where: { id }, data })
}

export async function deleteList(id: string) {
  return prisma.votingList.delete({ where: { id } })
}
