import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findListById } from "@/lib/repositories/list.repository"
import { countParticipantsByUserAndList, findParticipantsByListId } from "@/lib/repositories/participant.repository"
import { createManyNotifications } from "@/lib/repositories/notification.repository"

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(listId)
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
  if (!list.rankedVoting) {
    return NextResponse.json({ error: "Esta lista não usa votação por ranking" }, { status: 400 })
  }
  if (list.expiresAt && new Date(list.expiresAt) < new Date()) {
    return NextResponse.json({ error: "A votação desta lista expirou" }, { status: 400 })
  }

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, listId)) > 0

  if (!isParticipant && !list.isPublic) {
    return NextResponse.json({ error: "Você não é participante desta lista" }, { status: 403 })
  }

  const { rankings } = await req.json()
  if (!Array.isArray(rankings)) {
    return NextResponse.json({ error: "Rankings é obrigatório" }, { status: 400 })
  }

  if (rankings.length > list.maxRank) {
    return NextResponse.json({ error: `Máximo de ${list.maxRank} rankings permitidos` }, { status: 422 })
  }

  const rankSet = new Set<number>()
  for (const r of rankings) {
    if (r.rank < 1 || r.rank > (list.maxRank ?? 5)) {
      return NextResponse.json({ error: `Rank inválido: ${r.rank}` }, { status: 422 })
    }
    if (rankSet.has(r.rank)) {
      return NextResponse.json({ error: `Rank duplicado: ${r.rank}` }, { status: 422 })
    }
    rankSet.add(r.rank)
  }

  await prisma.$transaction(async (tx) => {
    if (!isParticipant && list.isPublic) {
      await tx.participant.upsert({
        where: { userId_listId: { userId: session.user.id, listId } },
        update: {},
        create: { userId: session.user.id, listId },
      })
    }

    await tx.vote.deleteMany({
      where: { voterId: session.user.id, option: { listId } },
    })

    for (const r of rankings) {
      await tx.vote.create({
        data: { voterId: session.user.id, optionId: r.optionId, rank: r.rank },
      })
    }
  })

  const participants = await findParticipantsByListId(listId)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "NEW_VOTE" as const,
      title: `${session.user.name ?? session.user.email} votou em "${list.name}"`,
      listId,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

  return NextResponse.json({ success: true })
}
