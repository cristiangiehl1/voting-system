import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findListsByUserIdPaginated } from "@/lib/repositories/list.repository"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ items: [], nextCursor: null })
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined
  const result = await findListsByUserIdPaginated(session.user.id, 12, cursor)
  return NextResponse.json(result)
}
