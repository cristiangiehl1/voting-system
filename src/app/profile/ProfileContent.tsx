"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AchievementBadge } from "@/components/AchievementBadge"
import { Skull, Trophy, MessageSquare, Flame, Zap, Calendar } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type ProfileAchievement = {
  id: string
  key: string
  name: string
  description: string
  icon: string | null
  category: string
  threshold: number | null
  unlocked: boolean
  unlockedAt: string | null
}

type ProfileStats = {
  totalVotes: number
  totalComments: number
  currentStreak: number
  longestStreak: number
  lastVoteDate: string | null
}

export function ProfileContent({
  user,
  stats,
  achievements,
}: {
  user: { name: string | null; email: string | null; image: string | null }
  stats: ProfileStats | null
  achievements: ProfileAchievement[]
}) {
  const categories = [...new Set(achievements.map((a) => a.category))] as const
  const categoryLabels: Record<string, string> = {
    voting: "Votação",
    comments: "Comentários",
    labels: "Labels",
    streak: "Sequência",
    special: "Especiais",
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-neon-cyan hover:text-neon-magenta transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="mb-8 text-center">
        <Avatar className="mx-auto h-24 w-24 ring-4 ring-neon-cyan/50 ring-offset-4 ring-offset-background">
          {user.image ? <AvatarImage src={user.image} alt="avatar" /> : null}
          <AvatarFallback className="bg-neon-magenta/20 text-3xl text-neon-magenta">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-3xl font-black tracking-wider uppercase">
          <span className="gradient-text">{user.name ?? "Sem nome"}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Trophy className="h-5 w-5 text-neon-cyan" />} label="Votos" value={stats?.totalVotes ?? 0} valueColor="#00f0ff" />
        <StatCard icon={<MessageSquare className="h-5 w-5 text-neon-magenta" />} label="Comentários" value={stats?.totalComments ?? 0} valueColor="#ff00aa" />
        <StatCard icon={<Flame className="h-5 w-5 text-neon-yellow" />} label="Sequência atual" value={stats?.currentStreak ?? 0} valueColor="#aaff00" />
        <StatCard icon={<Zap className="h-5 w-5 text-neon-purple" />} label="Maior sequência" value={stats?.longestStreak ?? 0} valueColor="#aa00ff" />
      </div>

      {stats?.lastVoteDate && (
        <p className="mb-8 text-center text-xs text-muted-foreground">
          <Calendar className="mr-1 inline h-3 w-3" />
          Último voto: {new Date(stats.lastVoteDate).toLocaleDateString("pt-BR", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}

      <div className="space-y-8">
        {categories.map((category) => {
          const items = achievements.filter((a) => a.category === category)
          const total = items.length
          const unlocked = items.filter((a) => a.unlocked).length
          return (
            <Card key={category} className="border-neon-cyan/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="gradient-text">{categoryLabels[category] ?? category}</span>
                  <span className="text-sm text-muted-foreground">
                    {unlocked}/{total}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((ach) => (
                    <AchievementBadge
                      key={ach.id}
                      name={ach.name}
                      description={ach.description}
                      icon={ach.icon ?? "🏆"}
                      unlocked={ach.unlocked}
                      unlockedAt={ach.unlockedAt ? new Date(ach.unlockedAt) : undefined}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {achievements.length === 0 && (
        <div className="py-20 text-center">
          <Skull className="mx-auto mb-4 h-16 w-16 text-neon-cyan/50" />
          <p className="text-lg text-muted-foreground">Nenhuma conquista disponível ainda...</p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode
  label: string
  value: number
  valueColor: string
}) {
  return (
    <Card className="border-neon-cyan/20 bg-card/50 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
        <div>{icon}</div>
        <p className="text-2xl font-black" style={{ color: valueColor }}>{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </CardContent>
    </Card>
  )
}
