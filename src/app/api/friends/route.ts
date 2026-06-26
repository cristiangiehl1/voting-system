import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findUserByEmail } from "@/lib/repositories/user.repository"
import { findFriendshipsByUserId, findFriendshipByUsers, createFriendRequest, resendFriendRequest } from "@/lib/repositories/friend.repository"
import { createNotification } from "@/lib/repositories/notification.repository"
import { sendFriendRequestSchema } from "@/lib/schemas/friendship"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const friendships = await findFriendshipsByUserId(session.user.id)
  return NextResponse.json(friendships)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = sendFriendRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const targetUser = await findUserByEmail(parsed.data.email)
  if (!targetUser) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  if (targetUser.id === session.user.id) {
    return NextResponse.json({ error: "Você não pode enviar um pedido para si mesmo" }, { status: 400 })
  }

  const existing = await findFriendshipByUsers(session.user.id, targetUser.id)
  if (existing) {
    if (existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "Vocês já são amigos" }, { status: 409 })
    }
    if (existing.status === "PENDING") {
      return NextResponse.json({ error: "Já existe um pedido de amizade pendente" }, { status: 409 })
    }
  }

  let friendship
  if (existing?.status === "REJECTED") {
    friendship = await resendFriendRequest(existing.id)
  } else {
    friendship = await createFriendRequest(session.user.id, targetUser.id)
  }

  await createNotification({
    userId: targetUser.id,
    type: "FRIEND_REQUEST_RECEIVED",
    title: "Novo pedido de amizade",
    message: `${session.user.name || session.user.email} enviou um pedido de amizade.`,
  })

  return NextResponse.json(friendship, { status: 201 })
}
