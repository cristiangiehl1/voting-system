import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findListById } from "@/lib/repositories/list.repository"
import { countParticipantsByUserAndList } from "@/lib/repositories/participant.repository"
import { findOptionsByListIdPaginated } from "@/lib/repositories/option.repository"

export async function GET(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(listId)
  if (!list) return NextResponse.json({ items: [], nextCursor: null })

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, listId)) > 0

  if (!isParticipant && !list.isPublic) return NextResponse.json({ items: [], nextCursor: null })

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined
  const result = await findOptionsByListIdPaginated(listId, list.revealVotes, 20, cursor)
  if (!list.revealVotes) {
    return NextResponse.json({ ...result, items: result.items.map((o) => ({ ...o, votes: [] })) })
  }
  return NextResponse.json(result)
}
