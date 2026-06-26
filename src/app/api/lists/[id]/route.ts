import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  findListById,
  updateList as updateListRepository,
  deleteList as deleteListRepository,
} from "@/lib/repositories/list.repository"
import { countParticipantsByUserAndList } from "@/lib/repositories/participant.repository"
import { findParticipantsByListId } from "@/lib/repositories/participant.repository"
import { createManyNotifications } from "@/lib/repositories/notification.repository"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(id)
  if (!list) return NextResponse.json(null)

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, id)) > 0

  if (!isParticipant && !list.isPublic) return NextResponse.json(null)

  return NextResponse.json(list)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(id)
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
  if (list.createdById !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode editar a lista" }, { status: 403 })
  }

  const body = await req.json()
  const parsedExpiresAt = body.expiresAt ? new Date(body.expiresAt) : null
  if (body.expiresAt && parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
    return NextResponse.json({ error: "Data de expiração inválida" }, { status: 400 })
  }

  const isRanked = body.rankedVoting ?? false
  await updateListRepository(id, {
    name: body.name,
    description: body.description,
    imageId: body.imageId,
    imageUrl: body.imageUrl,
    expiresAt: parsedExpiresAt,
    revealVotes: body.revealVotes,
    allowMultipleVotes: isRanked ? true : body.allowMultipleVotes,
    rankedVoting: isRanked,
    maxRank: body.maxRank,
    allowParticipantsToAddOptions: body.allowParticipantsToAddOptions,
    isPublic: body.isPublic,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(id)
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
  if (list.createdById !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode deletar a lista" }, { status: 403 })
  }

  const participants = await findParticipantsByListId(id)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "LIST_DELETED" as const,
      title: `${session.user.name ?? session.user.email} encerrou a lista "${list.name}"`,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

  await deleteListRepository(id)
  return NextResponse.json({ success: true })
}
