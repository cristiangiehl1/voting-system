import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findFriendshipsByUserId, rejectFriendRequest } from "@/lib/repositories/friend.repository"
import { findUserById } from "@/lib/repositories/user.repository"
import { createNotification } from "@/lib/repositories/notification.repository"

export async function POST(_req: Request, { params }: { params: Promise<{ friendId: string }> }) {
  const { friendId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { received } = await findFriendshipsByUserId(session.user.id)
  const friendship = received.find((f) => f.id === friendId)

  if (!friendship) {
    return NextResponse.json({ error: "Pedido de amizade não encontrado" }, { status: 404 })
  }

  if (friendship.status !== "PENDING") {
    return NextResponse.json({ error: "Este pedido já foi respondido" }, { status: 400 })
  }

  if (friendship.addresseeId !== session.user.id) {
    return NextResponse.json({ error: "Você não pode recusar este pedido" }, { status: 403 })
  }

  await rejectFriendRequest(friendId)

  const currentUser = await findUserById(session.user.id)

  await createNotification({
    userId: friendship.requesterId,
    type: "FRIEND_REQUEST_REJECTED",
    title: "Pedido de amizade recusado",
    message: `${currentUser?.name || currentUser?.email} recusou seu pedido de amizade.`,
  })

  return NextResponse.json({ success: true })
}
