import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findListById } from "@/lib/repositories/list.repository"
import { findInvitesByListId, createInvite } from "@/lib/repositories/invite.repository"
import { findUserByEmail } from "@/lib/repositories/user.repository"
import { findParticipantByUserAndList } from "@/lib/repositories/participant.repository"
import { createNotification } from "@/lib/repositories/notification.repository"

export async function GET(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const invites = await findInvitesByListId(listId)
  return NextResponse.json(invites)
}

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(listId)
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
  if (list.createdById !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode convidar participantes" }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
  if (email === session.user.email) {
    return NextResponse.json({ error: "Você não pode se convidar" }, { status: 400 })
  }

  const user = await findUserByEmail(email)
  if (user) {
    const participant = await findParticipantByUserAndList(user.id, listId)
    if (participant) {
      return NextResponse.json({ error: "Usuário já é participante desta lista" }, { status: 409 })
    }
  }

  const existingInvite = await prisma.invite.findUnique({
    where: { listId_email: { listId, email } },
  })
  if (existingInvite && existingInvite.status === "PENDING") {
    return NextResponse.json({ error: "Já existe um convite pendente para este email" }, { status: 409 })
  }

  await createInvite(listId, email)

  if (user) {
    await createNotification({
      userId: user.id,
      type: "INVITE_RECEIVED",
      title: `${session.user.name ?? session.user.email} te convidou para "${list.name}"`,
      listId,
    })
  }

  return NextResponse.json({ success: true })
}
