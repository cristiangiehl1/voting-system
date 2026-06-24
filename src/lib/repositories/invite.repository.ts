import { prisma } from "@/lib/prisma"

export async function findInvitesByEmail(email: string) {
  return prisma.invite.findMany({
    where: { email, status: "PENDING" },
    include: {
      list: {
        select: { id: true, name: true, createdBy: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function findInvitesByListId(listId: string) {
  return prisma.invite.findMany({
    where: { listId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createInvite(listId: string, email: string) {
  return prisma.invite.upsert({
    where: { listId_email: { listId, email } },
    update: { status: "PENDING" },
    create: { listId, email },
  })
}

export async function updateInviteStatus(inviteId: string, status: "PENDING" | "ACCEPTED" | "REJECTED") {
  return prisma.invite.update({
    where: { id: inviteId },
    data: { status },
  })
}

export async function deleteInvite(inviteId: string) {
  return prisma.invite.delete({ where: { id: inviteId } })
}

export async function countPendingInvitesByEmail(email: string) {
  return prisma.invite.count({ where: { email, status: "PENDING" } })
}
