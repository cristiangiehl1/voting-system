import { NextResponse } from "next/server"
import { findListById } from "@/lib/repositories/list.repository"
import { findOptionsByListId } from "@/lib/repositories/option.repository"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = await findListById(id)
  if (!list || !list.isPublic) return NextResponse.json([])

  const options = await findOptionsByListId(id, list.revealVotes)
  if (!list.revealVotes) {
    return NextResponse.json(options.map((o) => ({ ...o, votes: [] })))
  }
  return NextResponse.json(options)
}
