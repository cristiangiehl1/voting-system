import { NextResponse } from "next/server"
import { findListById } from "@/lib/repositories/list.repository"
import { getResultsByListId } from "@/lib/repositories/vote.repository"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = await findListById(id)
  if (!list || !list.isPublic) return NextResponse.json([])

  const results = await getResultsByListId(id, list.rankedVoting, list.maxRank, list.revealVotes)
  if (!list.revealVotes) {
    return NextResponse.json(results.map((r) => ({ ...r, votes: [] })))
  }
  return NextResponse.json(results)
}
