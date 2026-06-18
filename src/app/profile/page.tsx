import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfileContent } from "./ProfileContent"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [userStats, achievements, userAchievements] = await Promise.all([
    prisma.userStats.findUnique({ where: { userId: session.user.id } }),
    prisma.achievement.findMany({ orderBy: { category: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      include: { achievement: true },
    }),
  ])

  const ownedKeys = new Set(userAchievements.map((ua) => ua.achievement.key))

  return (
    <ProfileContent
      user={{ name: session.user.name, email: session.user.email, image: session.user.image }}
      stats={userStats ? {
        totalVotes: userStats.totalVotes,
        totalComments: userStats.totalComments,
        currentStreak: userStats.currentStreak,
        longestStreak: userStats.longestStreak,
        lastVoteDate: userStats.lastVoteDate?.toISOString() ?? null,
      } : null}
      achievements={achievements.map((a) => ({
        ...a,
        unlocked: ownedKeys.has(a.key),
        unlockedAt: userAchievements.find((ua) => ua.achievementId === a.id)?.unlockedAt.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  )
}
