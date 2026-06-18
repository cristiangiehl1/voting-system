"use client"

import { Suspense, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trophy, Medal, Frown, Crown, Swords, ArrowLeft, ListPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRankingLeaderboard, getRankings } from "@/app/actions/votes"
import { queryKeys } from "@/lib/query-keys"
import gsap from "gsap"

type RankingEntry = Awaited<ReturnType<typeof getRankingLeaderboard>>[number]

const POSITION_ICONS: Record<number, React.ReactNode> = {
  0: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 ring-2 ring-yellow-500/50">
      <Crown className="h-5 w-5 text-yellow-400" />
    </div>
  ),
  1: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400/20 ring-2 ring-gray-400/50">
      <Medal className="h-5 w-5 text-gray-300" />
    </div>
  ),
  2: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-700/20 ring-2 ring-amber-700/50">
      <Medal className="h-5 w-5 text-amber-600" />
    </div>
  ),
}

function RankingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rankingId = searchParams.get("rankingId") || ""
  const listRef = useRef<HTMLDivElement>(null)

  const { data: rankings = [] } = useQuery({
    queryKey: queryKeys.rankings,
    queryFn: getRankings,
  })

  const activeRankingId = rankingId || rankings[0]?.id || ""

  const { data: ranking = [] } = useQuery({
    queryKey: queryKeys.leaderboard(activeRankingId),
    queryFn: () => getRankingLeaderboard(activeRankingId),
    enabled: !!activeRankingId,
    refetchInterval: 10000,
  })

  const currentRanking = rankings.find((r) => r.id === activeRankingId)

  function handleRankingChange(value: string | null) {
    if (value) router.replace(`/ranking?rankingId=${value}`)
  }

  useEffect(() => {
    if (!listRef.current || ranking.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from(listRef.current!.children, {
        x: -20, opacity: 0, duration: 0.35, stagger: 0.04, ease: "power1.out", delay: 0.1,
      })
    })
    return () => ctx.revert()
  }, [ranking])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neon-magenta/10 ring-2 ring-neon-cyan/30">
          <Swords className="h-10 w-10 text-neon-magenta" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          <span className="gradient-text">{currentRanking?.name ?? "Ranking de Inconveniência"}</span>
        </h1>

        <div className="mx-auto mt-6 flex max-w-md items-center gap-3">
          <Select value={activeRankingId} onValueChange={handleRankingChange}>
            <SelectTrigger className="flex-1 border-neon-cyan/30 bg-background/50 text-foreground">
              <SelectValue placeholder="Selecione um ranking" />
            </SelectTrigger>
            <SelectContent className="border-neon-cyan/20 bg-background">
              {rankings.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {currentRanking?.description && (
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
            {currentRanking.description}
          </p>
        )}
      </div>

      <div ref={listRef} className="mx-auto max-w-2xl space-y-3">
        {ranking.map((candidate, index) => {
          const allLabels = candidate.votes.flatMap((v) => v.voteLabels.map((vl) => vl.label))
          const uniqueLabels = [...new Set(allLabels.map((l) => l.id))].map(
            (id) => allLabels.find((l) => l.id === id)!
          )

          return (
            <Card
              key={candidate.id}
              className={`bg-card/60 backdrop-blur-sm ${
                index === 0 ? "border-yellow-500/30" : ""
              }`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="shrink-0">
                  {POSITION_ICONS[index] ?? (
                    <div className="flex h-10 w-10 items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    </div>
                  )}
                </div>

                <Avatar className="h-12 w-12 shrink-0 ring-2 ring-neon-cyan/30">
                  {candidate.avatar ? <AvatarImage src={candidate.avatar} alt="meme" /> : null}
                  <AvatarFallback className="bg-neon-magenta/20 text-neon-magenta">
                    {candidate.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{candidate.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {uniqueLabels.slice(0, 3).map((label) => (
                      <Badge key={label.id} variant="outline" className="border-neon-cyan/20 text-[10px] text-neon-cyan">
                        {label.name}
                      </Badge>
                    ))}
                    {uniqueLabels.length > 3 && (
                      <Badge variant="secondary" className="bg-neon-magenta/10 text-[10px] text-neon-magenta">
                        +{uniqueLabels.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-neon-magenta">{candidate.totalVotes}</p>
                  <p className="text-xs text-muted-foreground">
                    voto{candidate.totalVotes !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {ranking.length === 0 && activeRankingId && (
        <div className="py-20 text-center">
          <Frown className="mx-auto mb-4 h-16 w-16 text-neon-cyan/50" />
          <p className="text-lg text-muted-foreground">Nenhum voto registrado ainda...</p>
          <p className="text-sm text-muted-foreground">Seja o primeiro a votar!</p>
        </div>
      )}

      {!activeRankingId && (
        <div className="py-20 text-center">
          <ListPlus className="mx-auto mb-4 h-16 w-16 text-neon-cyan/50" />
          <p className="text-lg text-muted-foreground">Nenhum ranking criado ainda.</p>
          <Link href="/" className="text-sm text-neon-cyan hover:text-neon-magenta transition-colors">
            Crie um ranking na página inicial
          </Link>
        </div>
      )}
    </div>
  )
}

export default function RankingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Carregando...</div>}>
      <RankingContent />
    </Suspense>
  )
}
