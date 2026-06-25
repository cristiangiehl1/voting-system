"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Trophy, Users, CalendarDays, ListOrdered, Share2, ExternalLink,
  Check, X, LogIn, Crown, Medal, ImageIcon, Loader2, ArrowLeft,
} from "lucide-react"
import {
  getPublicList,
  getPublicOptions,
  getMyVotes,
  vote,
  removeVote,
  submitRankedVotes,
} from "@/app/actions/lists"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"

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

function formatDate(date: Date | string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isExpired(date: Date | string | null) {
  if (!date) return false
  return new Date(date) < new Date()
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ShareContent() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const listId = params.id as string

  const { data: list } = useQuery({
    queryKey: queryKeys.publicList(listId),
    queryFn: () => getPublicList(listId),
    enabled: !!listId,
  })

  const { data: options = [] } = useQuery({
    queryKey: queryKeys.publicOptions(listId),
    queryFn: () => getPublicOptions(listId),
    enabled: !!listId,
  })

  const { data: myVotes = [] } = useQuery({
    queryKey: queryKeys.myVotes(listId),
    queryFn: () => getMyVotes(listId),
    enabled: !!listId && !!session?.user?.id,
  })

  const expired = isExpired(list?.expiresAt ?? null)
  const canVote = !!session?.user?.id && !expired

  const myVoteOptionIds = new Set(myVotes.map((v: { optionId: string }) => v.optionId))

  const [rankings, setRankings] = useState<Record<string, number>>({})
  const initializedRankings = myVotes.some((v: { rank: number | null }) => v.rank != null)

  if (!initializedRankings && Object.keys(rankings).length === 0 && myVotes.length > 0) {
    const initial: Record<string, number> = {}
    for (const v of myVotes) {
      if (v.rank != null) {
        initial[v.optionId] = v.rank
      }
    }
    if (Object.keys(initial).length > 0) {
      setTimeout(() => setRankings(initial), 0)
    }
  }

  function setRank(optionId: string, rank: number | null) {
    setRankings((prev) => {
      const next = { ...prev }
      const existingKey = Object.entries(next).find(([, r]) => r === rank)?.[0]
      if (existingKey && existingKey !== optionId) {
        delete next[existingKey]
      }
      if (rank == null) {
        delete next[optionId]
      } else {
        next[optionId] = rank
      }
      return next
    })
  }

  function getRank(optionId: string): number | null {
    return rankings[optionId] ?? null
  }

  function getRankOptions(optionId: string) {
    const maxRank = list?.maxRank ?? 5
    const usedRanks = new Set(Object.values(rankings))
    const currentRank = rankings[optionId]
    const ranks: Array<{ value: number; label: string; disabled: boolean }> = []
    for (let i = 1; i <= maxRank; i++) {
      ranks.push({
        value: i,
        label: `${i}º`,
        disabled: usedRanks.has(i) && currentRank !== i,
      })
    }
    return ranks
  }

  function isVoted(optionId: string) {
    if (list?.rankedVoting) {
      return getRank(optionId) != null
    }
    return myVoteOptionIds.has(optionId)
  }

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      await vote(optionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publicOptions(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.publicResults(listId) })
      toast.success("Voto registrado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao votar"),
  })

  const removeVoteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      await removeVote(optionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publicOptions(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.publicResults(listId) })
      toast.success("Voto removido")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover voto"),
  })

  const submitRankedMutation = useMutation({
    mutationFn: async (rankingsList: Array<{ optionId: string; rank: number }>) => {
      await submitRankedVotes(listId, rankingsList)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.publicOptions(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.publicResults(listId) })
      toast.success("Ranking registrado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao registrar ranking"),
  })

  const rankedVotesCount = Object.keys(rankings).length
  const canSubmitRanked = rankedVotesCount > 0

  async function copyShareLink() {
    const url = `${window.location.origin}/share/${listId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copiado!")
    } catch {
      toast.error("Erro ao copiar link")
    }
  }

  if (!list) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Início
          </Button>
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Copiar link
          </Button>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl">
          {list.imageUrl ? (
            <img src={list.imageUrl} alt={list.name} className="h-72 w-full object-cover" />
          ) : (
            <div className="flex h-72 w-full items-center justify-center bg-muted">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
            {expired ? (
              <Badge variant="secondary">Encerrada</Badge>
            ) : list.expiresAt ? (
              <Badge variant="default">Ativa</Badge>
            ) : (
              <Badge variant="outline">Indeterminada</Badge>
            )}
          </div>
          <p className="max-w-2xl text-muted-foreground">
            {list.description || "Sem descrição"}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {list.createdBy && (
              <span className="flex items-center gap-1.5">
                <Avatar size="sm">
                  {list.createdBy.imageUrl && <AvatarImage src={list.createdBy.imageUrl} alt={list.createdBy.name ?? ""} />}
                  <AvatarFallback className="text-[10px]">{getInitials(list.createdBy.name ?? "?")}</AvatarFallback>
                </Avatar>
                <span>{list.createdBy.name}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {list._count.participants + 1} participante{list._count.participants !== 0 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <ListOrdered className="h-4 w-4" />
              {options.length} opção{options.length !== 1 ? "es" : ""}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {list.expiresAt ? (
                expired ? (
                  <span>Encerrou em {formatDate(list.expiresAt)}</span>
                ) : (
                  <span>Até {formatDate(list.expiresAt)}</span>
                )
              ) : (
                <span>Sem data de expiração</span>
              )}
            </span>
            {list.rankedVoting ? (
              <Badge variant="default">
                <ListOrdered className="mr-1 h-3 w-3" />
                Top {list.maxRank}
              </Badge>
            ) : (
              <Badge variant={list.allowMultipleVotes ? "default" : "secondary"}>
                {list.allowMultipleVotes ? "Votos múltiplos" : "Voto único"}
              </Badge>
            )}
          </div>
        </div>

        {!session?.user?.id && !expired && (
          <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <p className="mb-3 text-muted-foreground">Faça login para votar nesta lista</p>
            <Link href={`/login?callbackUrl=/share/${listId}`}>
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            </Link>
          </div>
        )}

        {list.rankedVoting && canVote && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <ListOrdered className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Seu Top {list.maxRank}</p>
                  <p className="text-xs text-muted-foreground">
                    {rankedVotesCount}/{list.maxRank} posições preenchidas
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const rankingsList = Object.entries(rankings).map(([optionId, rank]) => ({
                    optionId,
                    rank,
                  }))
                  submitRankedMutation.mutate(rankingsList)
                }}
                disabled={!canSubmitRanked || submitRankedMutation.isPending}
              >
                <Check className="mr-2 h-4 w-4" />
                {submitRankedMutation.isPending ? "Salvando..." : "Registrar Ranking"}
              </Button>
            </div>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {options.map((option: {
            id: string; name: string; description?: string | null; referenceUrl?: string | null;
            imageUrl?: string | null; imageId?: string | null; _count?: { votes: number };
            createdBy?: { id: string; name: string | null; imageUrl: string | null };
          }, index: number) => {
            const voted = isVoted(option.id)
            const rank = getRank(option.id)
            const voteCount = option._count?.votes ?? 0

            return (
              <AnimatedCard
                key={option.id}
                className={`pt-0 ${voted && list?.rankedVoting ? "border-primary/50 bg-primary/5" : voted ? "border-primary/50" : ""}`}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="overflow-hidden rounded-t-xl">
                  {option.imageUrl ? (
                    <img src={option.imageUrl} alt={option.name} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold">
                      {option.name}
                      {option.referenceUrl && (
                        <a
                          href={option.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {getReferenceLabel(option.referenceUrl)}
                        </a>
                      )}
                    </h3>
                  </div>
                  {option.description && (
                    <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{option.description}</p>
                  )}
                  {option.createdBy && (
                    <div className="mb-3 flex items-center gap-1.5">
                      <Avatar size="sm">
                        {option.createdBy.imageUrl && <AvatarImage src={option.createdBy.imageUrl} alt={option.createdBy.name ?? ""} />}
                        <AvatarFallback className="text-[10px]">{getInitials(option.createdBy.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{option.createdBy.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {voteCount} voto{voteCount !== 1 ? "s" : ""}
                    </span>

                    {canVote && !list.rankedVoting && (
                      voted ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removeVoteMutation.mutate(option.id)}
                          disabled={removeVoteMutation.isPending}
                        >
                          {removeVoteMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => voteMutation.mutate(option.id)}
                          disabled={voteMutation.isPending || (!list.allowMultipleVotes && myVoteOptionIds.size > 0)}
                        >
                          {voteMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                      )
                    )}

                    {canVote && list?.rankedVoting && (
                      <div className="flex items-center gap-1">
                        {getRankOptions(option.id).map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setRank(option.id, rank === r.value ? null : r.value)}
                            disabled={r.disabled && rank !== r.value}
                            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all ${
                              rank === r.value
                                ? "bg-primary text-primary-foreground"
                                : r.disabled
                                  ? "cursor-not-allowed bg-muted text-muted-foreground/30"
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                        {rank != null && (
                          <button
                            type="button"
                            onClick={() => setRank(option.id, null)}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-xs font-medium text-destructive hover:bg-destructive/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            )
          })}
        </div>

        {options.length === 0 && (
          <div className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Nenhuma opção ainda</p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Link href={`/share/${listId}/results`}>
            <Button variant="default" size="lg">
              <Trophy className="mr-2 h-5 w-5" />
              Ver Resultados
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={copyShareLink}>
            <Share2 className="mr-2 h-5 w-5" />
            Compartilhar
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
