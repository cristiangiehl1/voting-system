import { prisma } from "@/lib/prisma"
import type { NotificationType } from "@/generated/prisma/enums"

export async function createNotification(data: {
  userId: string
  type: NotificationType
  title: string
  message?: string
  listId?: string
}) {
  return prisma.notification.create({ data })
}

export async function createManyNotifications(data: Array<{
  userId: string
  type: NotificationType
  title: string
  message?: string
  listId?: string
}>) {
  if (data.length === 0) return
  return prisma.notification.createMany({ data })
}

export async function findNotificationsByUserId(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: [{ readAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take,
  })
}

export async function countUnreadByUserId(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  })
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  })
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}
