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
  const participantEmails = await prisma.participant.findMany({
    where: { listId },
    select: { user: { select: { email: true } } },
  })

  const emailsToExclude = participantEmails
    .map((p) => p.user.email)
    .filter((e): e is string => !!e)

  return prisma.invite.findMany({
    where: {
      listId,
      status: "PENDING",
      ...(emailsToExclude.length > 0 ? { NOT: { email: { in: emailsToExclude } } } : {}),
    },
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
