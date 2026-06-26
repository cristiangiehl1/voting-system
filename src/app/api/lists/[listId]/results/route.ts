import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findListById } from "@/lib/repositories/list.repository"
import { countParticipantsByUserAndList } from "@/lib/repositories/participant.repository"
import { getResultsByListId } from "@/lib/repositories/vote.repository"

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

  const results = await getResultsByListId(listId, list.rankedVoting, list.maxRank, list.revealVotes)
  if (!list.revealVotes) {
    return NextResponse.json(results.map((r) => ({ ...r, votes: [] })))
  }
  return NextResponse.json(results)
}
