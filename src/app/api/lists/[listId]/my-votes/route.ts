import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findVotesByVoterAndList } from "@/lib/repositories/vote.repository"

export async function GET(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([])

  const votes = await findVotesByVoterAndList(session.user.id, listId)
  return NextResponse.json(votes)
}
