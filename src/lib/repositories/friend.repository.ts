import { prisma } from "@/lib/prisma"

export async function findFriendshipsByUserId(userId: string) {
  const [sent, received] = await Promise.all([
    prisma.friend.findMany({
      where: { requesterId: userId },
      include: {
        addressee: { select: { id: true, name: true, email: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friend.findMany({
      where: { addresseeId: userId },
      include: {
        requester: { select: { id: true, name: true, email: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { sent, received }
}

export async function findFriendshipByUsers(userIdA: string, userIdB: string) {
  return prisma.friend.findFirst({
    where: {
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
  })
}

export async function createFriendRequest(requesterId: string, addresseeId: string) {
  return prisma.friend.create({
    data: { requesterId, addresseeId },
  })
}

export async function resendFriendRequest(friendshipId: string) {
  return prisma.friend.update({
    where: { id: friendshipId },
    data: { status: "PENDING" },
  })
}

export async function acceptFriendRequest(friendshipId: string) {
  return prisma.friend.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
  })
}

export async function rejectFriendRequest(friendshipId: string) {
  return prisma.friend.update({
    where: { id: friendshipId },
    data: { status: "REJECTED" },
  })
}

export async function deleteFriendship(friendshipId: string) {
  return prisma.friend.delete({ where: { id: friendshipId } })
}
