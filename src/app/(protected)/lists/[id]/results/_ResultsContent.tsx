"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Medal, Crown, Frown, ListOrdered, ExternalLink } from "lucide-react"
import { api } from "@/lib/api-client"
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

const KNOWN_SITES: Record<string, string> = {
  "steampowered.com": "Steam",
  "store.steampowered.com": "Steam",
  "imdb.com": "IMDb",
  "rottentomatoes.com": "Rotten Tomatoes",
  "github.com": "GitHub",
  "myanimelist.net": "MyAnimeList",
  "letterboxd.com": "Letterboxd",
  "spotify.com": "Spotify",
  "open.spotify.com": "Spotify",
  "youtube.com": "YouTube",
  "netflix.com": "Netflix",
  "amazon.com": "Amazon",
  "amazon.com.br": "Amazon",
  "twitch.tv": "Twitch",
  "goodreads.com": "Goodreads",
  "wikipedia.org": "Wikipedia",
  "discord.com": "Discord",
  "steamcommunity.com": "Steam",
}

function getReferenceLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    const known = KNOWN_SITES[hostname]
    if (known) return known
    return hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1)
  } catch {
    return "Link"
  }
}

export default function ResultsPageContent() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string

  const { data: list, isPending: listLoading } = useQuery({
    queryKey: queryKeys.list(listId),
    queryFn: () => api.getList(listId),
    enabled: !!listId,
  })

  const { data: results = [], isPending: resultsLoading } = useQuery({
    queryKey: queryKeys.results(listId),
    queryFn: () => api.getResults(listId),
    enabled: !!listId,
    refetchInterval: 10000,
  })

  if (listLoading || resultsLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-10">
          <div className="mb-6 h-9 w-24 animate-pulse rounded bg-muted" />
          <div className="mb-8 flex flex-col items-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-2xl bg-muted" />
            <div className="mx-auto h-9 w-64 animate-pulse rounded bg-muted" />
            <div className="mx-auto mt-2 h-5 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-2 w-full rounded bg-muted" />
                  </div>
                  <div className="h-8 w-12 rounded bg-muted" />
                </div>
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
          </div>
        </div>
      </PageTransition>
    )
  }

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
                      <p className="truncate font-semibold">
                        {option.name}
                        {option.referenceUrl && (
                          <a
                            href={option.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                            title={option.referenceUrl}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {getReferenceLabel(option.referenceUrl)}
                          </a>
                        )}
                      </p>
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
