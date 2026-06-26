import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  findUserById,
  updateUser as updateUserRepository,
  countUserCreatedLists,
  countUserParticipations,
  countUserVotes,
} from "@/lib/repositories/user.repository"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(null)
  }

  const [dbUser, createdListsCount, participatingCount, votesCount] = await Promise.all([
    findUserById(session.user.id),
    countUserCreatedLists(session.user.id),
    countUserParticipations(session.user.id),
    countUserVotes(session.user.id),
  ])

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: dbUser?.name ?? session.user.name ?? null,
      email: session.user.email ?? null,
      imageUrl: dbUser?.imageUrl ?? null,
    },
    stats: {
      createdLists: createdListsCount,
      participatingLists: participatingCount,
      votes: votesCount,
    },
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const user = await findUserById(session.user.id)
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  const data = await req.json()
  await updateUserRepository(session.user.id, {
    name: data.name,
    imageId: data.imageId !== undefined ? data.imageId : undefined,
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
  })

  return NextResponse.json({ success: true })
}
