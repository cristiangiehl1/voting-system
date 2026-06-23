import { prisma } from "@/lib/prisma"

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function createUser(data: {
  email: string
  name: string
  passwordHash: string
}) {
  return prisma.user.create({ data })
}

export async function updateUser(
  id: string,
  data: {
    name?: string
    imageId?: string | null
    imageUrl?: string | null
  }
) {
  return prisma.user.update({ where: { id }, data })
}

export async function countUserCreatedLists(userId: string) {
  return prisma.votingList.count({ where: { createdById: userId } })
}

export async function countUserParticipations(userId: string) {
  return prisma.participant.count({ where: { userId } })
}

export async function countUserVotes(userId: string) {
  return prisma.vote.count({ where: { voterId: userId } })
}
