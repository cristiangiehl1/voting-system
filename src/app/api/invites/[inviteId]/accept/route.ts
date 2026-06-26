import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findUserById } from "@/lib/repositories/user.repository"
import { findListById } from "@/lib/repositories/list.repository"
import { createNotification } from "@/lib/repositories/notification.repository"

export async function POST(req: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 })
  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "Convite já foi respondido" }, { status: 400 })
  }

  const user = await findUserById(session.user.id)
  if (user?.email !== invite.email) {
    return NextResponse.json({ error: "Este convite não é para você" }, { status: 403 })
  }

  await prisma.$transaction([
    prisma.invite.update({ where: { id: inviteId }, data: { status: "ACCEPTED" } }),
    prisma.participant.upsert({
      where: { userId_listId: { userId: session.user.id, listId: invite.listId } },
      update: {},
      create: { userId: session.user.id, listId: invite.listId },
    }),
  ])

  const list = await findListById(invite.listId)
  if (list) {
    await createNotification({
      userId: list.createdById,
      type: "INVITE_ACCEPTED",
      title: `${user?.name ?? user?.email} aceitou seu convite para "${list.name}"`,
      listId: invite.listId,
    })
  }

  return NextResponse.json({ success: true })
}
