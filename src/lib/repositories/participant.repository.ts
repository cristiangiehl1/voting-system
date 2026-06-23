import { prisma } from "@/lib/prisma"

export async function findParticipantsByListId(listId: string) {
  return prisma.participant.findMany({
    where: { listId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  })
}

export async function findParticipantByUserAndList(userId: string, listId: string) {
  return prisma.participant.findUnique({
    where: { userId_listId: { userId, listId } },
  })
}

export async function countParticipantsByUserAndList(userId: string, listId: string) {
  return prisma.participant.count({ where: { listId, userId } })
}

export async function upsertParticipant(userId: string, listId: string) {
  return prisma.participant.upsert({
    where: { userId_listId: { userId, listId } },
    update: {},
    create: { userId, listId },
  })
}

export async function deleteParticipant(participantId: string) {
  return prisma.participant.delete({ where: { id: participantId } })
}
