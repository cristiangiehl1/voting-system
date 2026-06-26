import { NextResponse } from "next/server"
import { findParticipantsByListId } from "@/lib/repositories/participant.repository"

export async function GET(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const participants = await findParticipantsByListId(listId)
  return NextResponse.json(participants)
}
