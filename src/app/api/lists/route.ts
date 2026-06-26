import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  findListsByUserId,
  createList as createListRepository,
} from "@/lib/repositories/list.repository"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([])
  const lists = await findListsByUserId(session.user.id)
  return NextResponse.json(lists)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { name, description, expiresAt, revealVotes, allowMultipleVotes, rankedVoting, maxRank, allowParticipantsToAddOptions, isPublic } = body

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined
  if (parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
    return NextResponse.json({ error: "Data de expiração inválida" }, { status: 400 })
  }

  const isRanked = rankedVoting ?? false
  const list = await createListRepository({
    name,
    description: description || undefined,
    createdById: session.user.id,
    expiresAt: parsedExpiresAt,
    revealVotes,
    allowMultipleVotes: isRanked ? true : (allowMultipleVotes ?? false),
    rankedVoting: isRanked,
    maxRank,
    allowParticipantsToAddOptions,
    isPublic,
  })

  return NextResponse.json({ id: list.id })
}
