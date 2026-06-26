import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findFriendshipsByUserId, deleteFriendship } from "@/lib/repositories/friend.repository"

export async function DELETE(_req: Request, { params }: { params: Promise<{ friendId: string }> }) {
  const { friendId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { sent, received } = await findFriendshipsByUserId(session.user.id)
  const friendship = [...sent, ...received].find((f) => f.id === friendId)

  if (!friendship) {
    return NextResponse.json({ error: "Amizade não encontrada" }, { status: 404 })
  }

  await deleteFriendship(friendId)
  return NextResponse.json({ success: true })
}
