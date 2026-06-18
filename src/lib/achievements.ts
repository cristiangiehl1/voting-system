import { prisma } from "@/lib/prisma"
import { startOfDay, subDays } from "date-fns"

export const ACHIEVEMENT_DEFINITIONS = [
  { key: "first_vote", name: "Primeiro Voto", description: "Registre seu primeiro voto", icon: "🎯", category: "voting", threshold: 1 },
  { key: "voting_addict", name: "Viciado em Votar", description: "Acumule 100 votos", icon: "💉", category: "voting", threshold: 100 },
  { key: "super_voter", name: "Super Eleitor", description: "Acumule 500 votos", icon: "⚡", category: "voting", threshold: 500 },
  { key: "critic", name: "Crítico de TI", description: "Deixe 50 comentários", icon: "📝", category: "comments", threshold: 50 },
  { key: "label_hunter", name: "Label Hunter", description: "Use todos os 15 labels de inconveniência", icon: "🏷️", category: "labels", threshold: 15 },
  { key: "night_owl", name: "Corujão do Suporte", description: "Vote entre 22h e 6h", icon: "🦉", category: "special", threshold: null },
  { key: "streak_3", name: "Determinado", description: "Vote 3 dias seguidos", icon: "🔥", category: "streak", threshold: 3 },
  { key: "streak_7", name: "Persistente", description: "Vote 7 dias seguidos", icon: "🔥", category: "streak", threshold: 7 },
  { key: "streak_30", name: "Lendário", description: "Vote 30 dias seguidos", icon: "💎", category: "streak", threshold: 30 },
  { key: "ranking_explorer", name: "Explorador", description: "Vote em todos os rankings existentes", icon: "🌍", category: "special", threshold: null },
  { key: "early_adopter", name: "Pioneiro", description: "Seja a primeira pessoa a votar em alguém", icon: "🥇", category: "special", threshold: null },
] as const

type AchievementKey = (typeof ACHIEVEMENT_DEFINITIONS)[number]["key"]

export async function getOrCreateUserStats(userId: string) {
  let stats = await prisma.userStats.findUnique({ where: { userId } })
  if (!stats) {
    stats = await prisma.userStats.create({
      data: { userId, totalVotes: 0, totalComments: 0, currentStreak: 0, longestStreak: 0 },
    })
  }
  return stats
}

export async function checkAndUnlockAchievements(
  userId: string
): Promise<{ key: string; name: string; description: string; icon: string }[]> {
  const newlyUnlocked: { key: string; name: string; description: string; icon: string }[] = []
  const stats = await getOrCreateUserStats(userId)
  const owned = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  })
  const ownedKeys = new Set(owned.map((ua) => ua.achievement.key))

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (ownedKeys.has(def.key)) continue
    let unlocked = false

    switch (def.key) {
      case "first_vote": {
        unlocked = stats.totalVotes >= 1
        break
      }
      case "voting_addict": {
        unlocked = stats.totalVotes >= 100
        break
      }
      case "super_voter": {
        unlocked = stats.totalVotes >= 500
        break
      }
      case "critic": {
        unlocked = stats.totalComments >= 50
        break
      }
      case "label_hunter": {
        const usedLabelsResult = await prisma.voteLabel.findMany({
          where: { vote: { voterId: userId } },
          select: { labelId: true },
          distinct: ["labelId"],
        })
        unlocked = usedLabelsResult.length >= 15
        break
      }
      case "night_owl": {
        const hour = new Date().getHours()
        unlocked = hour >= 22 || hour < 6
        break
      }
      case "streak_3":
      case "streak_7":
      case "streak_30": {
        unlocked = stats.currentStreak >= (def.threshold ?? 0)
        break
      }
      case "ranking_explorer": {
        const totalRankings = await prisma.ranking.count()
        if (totalRankings === 0) break
        const userVotes = await prisma.vote.findMany({
          where: { voterId: userId },
          select: { candidate: { select: { rankingId: true } } },
        })
        const rankingIds = new Set(userVotes.map((v) => v.candidate.rankingId))
        unlocked = rankingIds.size >= totalRankings
        break
      }
      case "early_adopter": {
        const firstVote = await prisma.vote.findFirst({
          where: { voterId: userId },
          orderBy: { createdAt: "asc" },
        })
        if (!firstVote) break
        const firstVoteOnCandidate = await prisma.vote.findFirst({
          where: { candidateId: firstVote.candidateId },
          orderBy: { createdAt: "asc" },
        })
        unlocked = firstVoteOnCandidate?.voterId === userId
        break
      }
    }

    if (unlocked) {
      const ach = await prisma.achievement.findUnique({ where: { key: def.key } })
      if (ach) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: ach.id } },
          update: {},
          create: { userId, achievementId: ach.id },
        })
        newlyUnlocked.push({ key: def.key, name: ach.name, description: ach.description, icon: ach.icon ?? "" })
      }
    }
  }

  return newlyUnlocked
}

export async function updateVoteStreak(userId: string) {
  const stats = await getOrCreateUserStats(userId)
  const today = startOfDay(new Date())
  const yesterday = subDays(today, 1)
  const lastDate = stats.lastVoteDate ? startOfDay(stats.lastVoteDate) : null

  let newStreak = 1
  if (lastDate) {
    if (lastDate.getTime() === today.getTime()) {
      newStreak = stats.currentStreak
    } else if (lastDate.getTime() === yesterday.getTime()) {
      newStreak = stats.currentStreak + 1
    } else {
      newStreak = 1
    }
  }

  await prisma.userStats.update({
    where: { userId },
    data: {
      totalVotes: { increment: 1 },
      currentStreak: newStreak,
      longestStreak: Math.max(stats.longestStreak, newStreak),
      lastVoteDate: new Date(),
    },
  })
}

export async function incrementCommentCount(userId: string) {
  await prisma.userStats.update({
    where: { userId },
    data: { totalComments: { increment: 1 } },
  })
}
