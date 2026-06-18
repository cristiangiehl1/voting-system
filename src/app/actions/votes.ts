"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchRandomMeme } from "@/lib/meme"
import { revalidatePath } from "next/cache"

export async function getRankings() {
  return prisma.ranking.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { candidates: true } } },
  })
}

export async function getRanking(id: string) {
  return prisma.ranking.findUnique({
    where: { id },
    include: { _count: { select: { candidates: true } } },
  })
}

export async function getCandidates(rankingId: string) {
  return prisma.candidate.findMany({
    where: { rankingId },
    orderBy: { name: "asc" },
    include: { _count: { select: { votes: true } } },
  })
}

export async function getLabels() {
  return prisma.label.findMany({ orderBy: { name: "asc" } })
}

export async function getRankingLeaderboard(rankingId: string) {
  const candidates = await prisma.candidate.findMany({
    where: { rankingId },
    include: {
      _count: { select: { votes: true } },
      votes: {
        include: {
          voter: true,
          voteLabels: { include: { label: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return candidates
    .map((c) => ({ ...c, totalVotes: c._count.votes }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 10)
}

export async function getMyVotes(rankingId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.vote.findMany({
    where: {
      voterId: session.user.id,
      candidate: { rankingId },
    },
    include: {
      candidate: true,
      voteLabels: { include: { label: true } },
    },
  })
}

export async function createRanking(name: string, description?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  if (!name) throw new Error("Nome é obrigatório")

  const ranking = await prisma.ranking.create({
    data: {
      name,
      description: description || undefined,
      createdById: session.user.id,
    },
  })

  revalidatePath("/")
  return ranking.id
}

export async function createCandidate(name: string, rankingId: string, email?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  if (!name || !rankingId) throw new Error("Nome e ranking são obrigatórios")

  const avatar = await fetchRandomMeme()

  await prisma.candidate.create({
    data: { name, email: email || undefined, avatar, rankingId },
  })

  revalidatePath("/")
  revalidatePath("/ranking")
}

export async function vote(candidateId: string, comment: string, labelIds: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const existing = await prisma.vote.findUnique({
    where: { voterId_candidateId: { voterId: session.user.id, candidateId } },
  })
  if (existing) throw new Error("Você já votou neste candidato")

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { rankingId: true },
  })
  if (!candidate) throw new Error("Candidato não encontrado")

  await prisma.vote.create({
    data: {
      voterId: session.user.id,
      candidateId,
      comment: comment || undefined,
      voteLabels: { create: labelIds.map((labelId) => ({ labelId })) },
    },
  })

  revalidatePath("/")
  revalidatePath("/ranking")
}
