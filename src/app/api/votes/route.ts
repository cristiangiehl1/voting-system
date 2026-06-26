import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findOptionById } from "@/lib/repositories/option.repository"
import { countParticipantsByUserAndList } from "@/lib/repositories/participant.repository"
import { findParticipantsByListId } from "@/lib/repositories/participant.repository"
import { createManyNotifications } from "@/lib/repositories/notification.repository"
import { deleteVotesByVoterAndOption } from "@/lib/repositories/vote.repository"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { optionId } = await req.json()
  if (!optionId) return NextResponse.json({ error: "optionId é obrigatório" }, { status: 400 })

  const option = await findOptionById(optionId)
  if (!option) return NextResponse.json({ error: "Opção não encontrada" }, { status: 404 })

  const list = option.list
  if (list.expiresAt && new Date(list.expiresAt) < new Date()) {
    return NextResponse.json({ error: "A votação desta lista expirou" }, { status: 400 })
  }

  if (list.rankedVoting) {
    return NextResponse.json({ error: "Esta lista usa votação por ranking. Use o formulário de ranking para votar." }, { status: 400 })
  }

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, list.id)) > 0

  if (!isParticipant && !list.isPublic) {
    return NextResponse.json({ error: "Você não é participante desta lista" }, { status: 403 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (!isParticipant && list.isPublic) {
        await tx.participant.upsert({
          where: { userId_listId: { userId: session.user.id, listId: list.id } },
          update: {},
          create: { userId: session.user.id, listId: list.id },
        })
      }

      const existing = await tx.vote.findUnique({
        where: { voterId_optionId: { voterId: session.user.id, optionId } },
      })
      if (existing) throw new Error("Você já votou nesta opção")

      if (!list.allowMultipleVotes) {
        const votesInList = await tx.vote.count({
          where: { voterId: session.user.id, option: { listId: list.id } },
        })
        if (votesInList > 0) throw new Error("Esta lista permite apenas um voto por participante")
      }

      await tx.vote.create({
        data: { voterId: session.user.id, optionId },
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao votar"
    const status = message.includes("já votou") ? 409 : message.includes("apenas um voto") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }

  const participants = await findParticipantsByListId(list.id)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "NEW_VOTE" as const,
      title: `${session.user.name ?? session.user.email} votou em "${list.name}"`,
      listId: list.id,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { optionId } = await req.json()
  if (!optionId) return NextResponse.json({ error: "optionId é obrigatório" }, { status: 400 })

  const option = await findOptionById(optionId)
  if (!option) return NextResponse.json({ error: "Opção não encontrada" }, { status: 404 })

  await deleteVotesByVoterAndOption(session.user.id, optionId)
  return NextResponse.json({ success: true })
}
