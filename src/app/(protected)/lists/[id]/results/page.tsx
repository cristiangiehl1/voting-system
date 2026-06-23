"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Medal, Crown, Frown, ListOrdered } from "lucide-react"
import { getResults, getList } from "@/app/actions/lists"
import { AnimatedCard } from "@/components/AnimatedCard"
import { AnimatedCounter } from "@/components/AnimatedCounter"
import { VoteBars } from "@/components/VoteBars"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"

const POSITION_ICONS: Record<number, React.ReactNode> = {
  0: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 ring-2 ring-yellow-400/60">
      <Crown className="h-5 w-5 text-yellow-400" />
    </div>
  ),
  1: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-400/20 ring-2 ring-slate-400/60">
      <Medal className="h-5 w-5 text-slate-300" />
    </div>
  ),
  2: (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600/20 ring-2 ring-amber-600/60">
      <Medal className="h-5 w-5 text-amber-500" />
    </div>
  ),
}

const BAR_COLORS = ["#60a5fa", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#f87171"]

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string

  const { data: list } = useQuery({
    queryKey: queryKeys.list(listId),
    queryFn: () => getList(listId),
    enabled: !!listId,
  })

  const { data: results = [] } = useQuery({
    queryKey: queryKeys.results(listId),
    queryFn: () => getResults(listId),
    enabled: !!listId,
    refetchInterval: 10000,
  })

  const isRanked = list?.rankedVoting ?? false
  const totalVotes = results.reduce((sum, o) => sum + o.totalVotes, 0)
  const maxVotes = results.length > 0 ? Math.max(...results.map((o) => o.totalVotes)) : 0

  const barsData = results.map((o, i) => ({
    name: o.name,
    value: o.totalVotes,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }))

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/lists/${listId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{list?.name ?? "Resultados"}</h1>
          <p className="mt-2 text-muted-foreground">
            {isRanked ? (
              <>
                <AnimatedCounter value={totalVotes} /> pontos distribuídos entre{" "}
                {results.length} opção{results.length !== 1 ? "es" : ""}
              </>
            ) : (
              <>
                <AnimatedCounter value={totalVotes} /> voto{totalVotes !== 1 ? "s" : ""} distribuídos entre{" "}
                {results.length} opção{results.length !== 1 ? "es" : ""}
              </>
            )}
          </p>
          {isRanked && (
            <div className="mt-2">
              <Badge variant="outline">
                <ListOrdered className="mr-1 h-3 w-3" />
                Votação por ranking (Top {list?.maxRank ?? 5})
              </Badge>
            </div>
          )}
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            {results.map((option, index) => {
              const percentage = maxVotes > 0 ? Math.round((option.totalVotes / maxVotes) * 100) : 0
              return (
                <AnimatedCard key={option.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {option.imageUrl ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                        <img src={option.imageUrl} alt={option.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0">
                        {POSITION_ICONS[index] ?? (
                          <div className="flex h-10 w-10 items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{option.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {option.description || "Sem descrição"}
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        <AnimatedCounter value={option.totalVotes} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isRanked ? "pontos" : "voto" + (option.totalVotes !== 1 ? "s" : "")}
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              )
            })}
          </div>

          {results.length > 0 && (
            <AnimatedCard className="h-fit p-6">
              <h2 className="mb-4 text-lg font-semibold">
                {isRanked ? "Distribuição de pontos" : "Distribuição de votos"}
              </h2>
              <VoteBars data={barsData} />
            </AnimatedCard>
          )}
        </div>

        {results.length === 0 && (
          <div className="py-20 text-center">
            <Frown className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Nenhum voto registrado ainda...</p>
            <Link href={`/lists/${listId}`}>
              <Button variant="outline" className="mt-4">
                Voltar para a lista
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
