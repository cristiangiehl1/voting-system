import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getVotingHistoryByUserId } from "@/lib/repositories/vote.repository"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([])

  const history = await getVotingHistoryByUserId(session.user.id)
  return NextResponse.json(history)
}
