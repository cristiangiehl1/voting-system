import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findListById } from "@/lib/repositories/list.repository"
import { countParticipantsByUserAndList } from "@/lib/repositories/participant.repository"
import { findOptionsByListId, createOption as createOptionRepository } from "@/lib/repositories/option.repository"
import { findParticipantsByListId } from "@/lib/repositories/participant.repository"
import { createManyNotifications } from "@/lib/repositories/notification.repository"

export async function GET(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(listId)
  if (!list) return NextResponse.json([])

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, listId)) > 0

  if (!isParticipant && !list.isPublic) return NextResponse.json([])

  const options = await findOptionsByListId(listId, list.revealVotes)
  if (!list.revealVotes) {
    return NextResponse.json(options.map((o) => ({ ...o, votes: [] })))
  }
  return NextResponse.json(options)
}

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(listId)
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
  if (list.createdById !== session.user.id && !list.allowParticipantsToAddOptions) {
    return NextResponse.json({ error: "Apenas o criador pode adicionar opções" }, { status: 403 })
  }

  const { name, description, referenceUrl, imageId, imageUrl } = await req.json()
  if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })

  await createOptionRepository({
    name,
    description: description || undefined,
    referenceUrl: referenceUrl || undefined,
    imageId: imageId || undefined,
    imageUrl: imageUrl || undefined,
    listId,
    createdById: session.user.id,
  })

  const participants = await findParticipantsByListId(listId)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "OPTION_ADDED" as const,
      title: `${session.user.name ?? session.user.email} adicionou "${name}" em "${list.name}"`,
      listId,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

  return NextResponse.json({ success: true })
}
