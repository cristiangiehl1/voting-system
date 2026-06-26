import { auth } from "@/lib/auth"
import {
  findUserById,
  countUserCreatedLists,
  countUserParticipations,
  countUserVotes,
} from "@/lib/repositories/user.repository"
import { ProfileContent } from "./ProfileContent"

export default async function ProfilePage() {
  const session = (await auth())!
  const user = session.user!
  const userId = user.id

  const [dbUser, createdListsCount, participatingCount, votesCount] = await Promise.all([
    findUserById(userId),
    countUserCreatedLists(userId),
    countUserParticipations(userId),
    countUserVotes(userId),
  ])

  const data = {
    user: {
      id: userId,
      name: dbUser?.name ?? user.name ?? null,
      email: user.email ?? null,
      imageUrl: dbUser?.imageUrl ?? null,
    },
    stats: {
      createdLists: createdListsCount,
      participatingLists: participatingCount,
      votes: votesCount,
    },
  }

  return (
    <ProfileContent
      user={data.user}
      stats={data.stats}
    />
  )
}
