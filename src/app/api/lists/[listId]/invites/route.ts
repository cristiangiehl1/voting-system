import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findListById } from "@/lib/repositories/list.repository"
import { findInvitesByListId, createInvite } from "@/lib/repositories/invite.repository"
import { findUserByEmail } from "@/lib/repositories/user.repository"
import { findParticipantByUserAndList } from "@/lib/repositories/participant.repository"
import { createNotification } from "@/lib/repositories/notification.repository"

export async function GET(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
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

  const body = await req.json()
  const emails: string[] = body.emails ?? (body.email ? [body.email] : [])

  if (emails.length === 0) {
    return NextResponse.json({ error: "Pelo menos um email é obrigatório" }, { status: 400 })
  }

  const result = { invited: 0, errors: [] as { email: string; error: string }[] }

  for (const email of emails) {
    if (!email || !email.includes("@")) {
      result.errors.push({ email, error: "Email inválido" })
      continue
    }

    if (email === session.user.email) {
      result.errors.push({ email, error: "Você não pode se convidar" })
      continue
    }

    const user = await findUserByEmail(email)
    if (user) {
      const participant = await findParticipantByUserAndList(user.id, listId)
      if (participant) {
        result.errors.push({ email, error: "Usuário já é participante" })
        continue
      }
    }

    const existingInvite = await prisma.invite.findUnique({
      where: { listId_email: { listId, email } },
    })
    if (existingInvite && existingInvite.status === "PENDING") {
      result.errors.push({ email, error: "Convite já pendente" })
      continue
    }

    await createInvite(listId, email)
    result.invited++

    if (user) {
      await createNotification({
        userId: user.id,
        type: "INVITE_RECEIVED",
        title: `${session.user.name ?? session.user.email} te convidou para "${list.name}"`,
        listId,
      })
    }
  }

  return NextResponse.json(result)
}
