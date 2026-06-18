import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { checkAndUnlockAchievements, updateVoteStreak, incrementCommentCount } from "@/lib/achievements"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { candidateId, comment, labelIds } = await req.json()

    if (!candidateId) {
      return NextResponse.json({ error: "Candidato é obrigatório" }, { status: 400 })
    }

    const existing = await prisma.vote.findUnique({
      where: { voterId_candidateId: { voterId: session.user.id, candidateId } },
    })
    if (existing) {
      return NextResponse.json({ error: "Você já votou neste candidato" }, { status: 409 })
    }

    await prisma.vote.create({
      data: {
        voterId: session.user.id,
        candidateId,
        comment: comment || undefined,
        voteLabels: { create: (labelIds || []).map((id: string) => ({ labelId: id })) },
      },
    })

    await updateVoteStreak(session.user.id)
    if (comment) await incrementCommentCount(session.user.id)

    const achievements = await checkAndUnlockAchievements(session.user.id)

    return NextResponse.json({ success: true, achievements })
  } catch (error) {
    console.error("Error voting:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { candidateId, comment, labelIds } = await req.json()

    if (!candidateId) {
      return NextResponse.json({ error: "Candidato é obrigatório" }, { status: 400 })
    }

    const vote = await prisma.vote.findUnique({
      where: { voterId_candidateId: { voterId: session.user.id, candidateId } },
    })
    if (!vote) {
      return NextResponse.json({ error: "Voto não encontrado" }, { status: 404 })
    }

    await prisma.voteLabel.deleteMany({ where: { voteId: vote.id } })

    if (labelIds && labelIds.length > 0) {
      await prisma.voteLabel.createMany({
        data: labelIds.map((id: string) => ({ voteId: vote.id, labelId: id })),
      })
    }

    if (comment !== undefined) {
      await prisma.vote.update({
        where: { id: vote.id },
        data: { comment: comment || null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating vote:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
