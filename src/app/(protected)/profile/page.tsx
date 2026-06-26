import { auth } from "@/lib/auth"
import {
  findUserById,
  countUserCreatedLists,
  countUserParticipations,
  countUserVotes,
} from "@/lib/repositories/user.repository"
import { ProfileContent } from "./ProfileContent"

export default async function ProfilePage() {
  const session = await auth()

  const [dbUser, createdListsCount, participatingCount, votesCount] = await Promise.all([
    findUserById(session!.user!.id),
    countUserCreatedLists(session.user.id),
    countUserParticipations(session.user.id),
    countUserVotes(session.user.id),
  ])

  const data = {
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
  }

  return (
    <ProfileContent
      user={data.user}
      stats={data.stats}
    />
  )
}
