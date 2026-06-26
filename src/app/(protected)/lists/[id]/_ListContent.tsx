"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Users,
  ArrowLeft,
  Trophy,
  CalendarDays,
  Trash2,
  Check,
  X,
  ListOrdered,
  Pencil,
  ExternalLink,
  ImageIcon,
  Share2,
  ArrowRight,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"
import { useList } from "@/hooks/queries/useList"
import { useOptions } from "@/hooks/queries/useOptions"
import { useParticipants } from "@/hooks/queries/useParticipants"
import { useMyVotes } from "@/hooks/queries/useMyVotes"
import { useInvites } from "@/hooks/queries/useInvites"
import { useRemoveParticipant } from "@/hooks/mutations/useRemoveParticipant"
import { useVote } from "@/hooks/mutations/useVote"
import { useRemoveVote } from "@/hooks/mutations/useRemoveVote"
import { useUpdateOptionImage } from "@/hooks/mutations/useUpdateOptionImage"
import { useUpdateOption } from "@/hooks/mutations/useUpdateOption"
import { useRemoveOption } from "@/hooks/mutations/useRemoveOption"
import { useSubmitRankedVotes } from "@/hooks/mutations/useSubmitRankedVotes"
import { useCancelInvite } from "@/hooks/mutations/useCancelInvite"
import { ListSkeleton } from "@/components/skeletons/ListSkeleton"
import { SettingsDialog } from "./_SettingsDialog"
import { OptionDialog } from "./_OptionDialog"
import { InviteDialog } from "./_InviteDialog"

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

export default function ListPageContent() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const listId = params.id as string

  const { data: list } = useList(listId)
  const { data: optionsData, isPending: optionsLoading, fetchNextPage: fetchNextOptions, hasNextPage: hasNextOptions, isFetchingNextPage: fetchingNextOptions } = useOptions(listId)
  const options = optionsData?.pages.flatMap(p => p.items) ?? []

  const { data: participants = [] } = useParticipants(listId)
  const { data: myVotesData } = useMyVotes(listId, !!session?.user?.id)
  const myVotes = myVotesData ?? []

  const { data: userLists = [] } = useQuery({
    queryKey: ["my-lists"],
    queryFn: () => api.getMyLists(),
    enabled: !!session?.user?.id,
  })

  const currentIndex = userLists.findIndex((l) => l.id === listId)
  const prevList = currentIndex > 0 ? userLists[currentIndex - 1] : null
  const nextList = currentIndex >= 0 && currentIndex < userLists.length - 1 ? userLists[currentIndex + 1] : null

  const isOwner = list?.createdById === session?.user?.id
  const expired = isExpired(list?.expiresAt ?? null)
  const isParticipant =
    isOwner || participants.some((p) => p.user.id === session?.user?.id)
  const canManageOptions = isOwner || (isParticipant && list?.allowParticipantsToAddOptions)

  const { data: invites = [] } = useInvites(listId, !!listId && isOwner)

  const cancelInviteMutation = useCancelInvite(listId,
    () => toast.success("Convite cancelado"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao cancelar convite"),
  )

  const removeParticipantMutation = useRemoveParticipant(listId,
    () => toast.success("Participante removido"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover participante"),
  )

  const voteMutation = useVote(listId, false,
    () => toast.success("Voto registrado"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao votar"),
  )

  const removeVoteMutation = useRemoveVote(listId, false,
    () => toast.success("Voto removido"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover voto"),
  )

  const updateOptionImageMutation = useUpdateOptionImage(listId,
    () => toast.success("Imagem atualizada"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar imagem"),
  )

  async function handleChangeOptionImage(optionId: string) {
    const option = options.find((o) => o.id === optionId)
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "option")
      if (option?.imageId) {
        formData.append("publicId", option.imageId)
      }

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || "Erro ao fazer upload")
        await updateOptionImageMutation.mutateAsync({
          optionId,
          imageId: result.publicId,
          imageUrl: result.secureUrl,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao fazer upload")
      }
    }
    input.click()
  }

  const [editOptionId, setEditOptionId] = useState<string | null>(null)
  const editOption = options.find((o) => o.id === editOptionId)
  const [editOptionName, setEditOptionName] = useState("")
  const [editOptionDesc, setEditOptionDesc] = useState("")
  const [editOptionUrl, setEditOptionUrl] = useState("")

  const updateOptionMutation = useUpdateOption(listId,
    () => {
      setEditOptionId(null)
      toast.success("Opção atualizada")
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar opção"),
  )

  const removeOptionMutation = useRemoveOption(listId,
    () => toast.success("Opção removida"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover opção"),
  )

  const submitRankedMutation = useSubmitRankedVotes(listId, false,
    () => toast.success("Ranking registrado"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao registrar ranking"),
  )

  async function copyShareLink() {
    const url = `${window.location.origin}/share/${listId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link público copiado!")
    } catch {
      toast.error("Erro ao copiar link")
    }
  }

  const [rankings, setRankings] = useState<Record<string, number>>({})

  useEffect(() => {
    const initial: Record<string, number> = {}
    for (const v of myVotes) {
      if (v.rank != null) {
        initial[v.optionId] = v.rank
      }
    }
    setRankings(initial)
  }, [myVotesData])

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

  const rankedVotesCount = Object.keys(rankings).length
  const canSubmitRanked = rankedVotesCount > 0

  const rankedOptions = options.filter((o) => getRank(o.id) != null)
  const unrankedOptions = options.filter((o) => getRank(o.id) == null)

  if (!list) {
    return <ListSkeleton />
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            {prevList && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/lists/${prevList.id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {prevList.name}
              </Button>
            )}
            {nextList && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/lists/${nextList.id}`)}>
                {nextList.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          {list.imageUrl ? (
            <>
              <div
                className="absolute inset-0 opacity-20 blur-3xl pointer-events-none"
                style={{
                  maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                }}
              >
                <img src={list.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <img src={list.imageUrl} alt={list.name} className="aspect-square w-full max-w-md mx-auto object-cover rounded-2xl" />
              </div>
            </>
          ) : (
            <div className="flex aspect-square w-full max-w-md mx-auto items-center justify-center rounded-2xl bg-muted">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
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
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {participants.length + 1} participante{participants.length !== 0 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
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

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={copyShareLink}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>

            <Link href={`/lists/${listId}/results`}>
              <Button variant="outline">
                <Trophy className="mr-2 h-4 w-4" />
                Resultados
              </Button>
            </Link>

            {isOwner && <SettingsDialog listId={listId} list={list} />}

            {(isOwner || (isParticipant && list?.allowParticipantsToAddOptions)) && !expired && (
              <>
                <OptionDialog listId={listId} />
                <InviteDialog listId={listId} />
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="options">
          <TabsList>
            <TabsTrigger value="options">Opções</TabsTrigger>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="mt-4">
            {options.length === 0 ? (
              <AnimatedCard className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">Nenhuma opção ainda</p>
                  {canManageOptions && !expired && (
                    <p className="text-sm text-muted-foreground">
                      Adicione opções para iniciar a votação.
                    </p>
                  )}
                </CardContent>
              </AnimatedCard>
            ) : list?.rankedVoting && (isParticipant || list?.isPublic) && !expired ? (
              <div>
                <AnimatedCard className="mb-6 border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <ListOrdered className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            Seu Top {list.maxRank}
                          </p>
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
                  </CardContent>
                </AnimatedCard>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {[...rankedOptions, ...unrankedOptions].map((option, index) => {
                    const rank = getRank(option.id)
                    return (
                      <AnimatedCard
                        key={option.id}
                        className={`pt-0 ${rank != null ? "border-primary/50 bg-primary/5" : ""}`}
                        style={{ animationDelay: `${index * 0.06}s` }}
                      >
                          <div className="group relative overflow-hidden rounded-t-xl">
                            {option.imageUrl ? (
                              <img src={option.imageUrl} alt={option.name} className="aspect-square w-full object-cover" />
                            ) : (
                              <div className="flex aspect-square w-full items-center justify-center bg-muted">
                                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                              </div>
                            )}
                            {canManageOptions && !expired && (
                              <button
                                type="button"
                                onClick={() => handleChangeOptionImage(option.id)}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow transition-opacity hover:bg-background group-hover:opacity-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        <CardHeader className="pb-2 px-3 pt-3">
                          <div className="flex items-start justify-between gap-1">
                            <CardTitle className="text-sm leading-tight">
                              {option.name}
                              {option.referenceUrl && (
                                <a
                                  href={option.referenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
                                  title={option.referenceUrl}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-2.5 w-2.5" />
                                  {getReferenceLabel(option.referenceUrl)}
                                </a>
                              )}
                            </CardTitle>
                            {canManageOptions && !expired && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditOptionName(option.name)
                                  setEditOptionDesc(option.description ?? "")
                                  setEditOptionUrl(option.referenceUrl ?? "")
                                  setEditOptionId(option.id)
                                }}
                                className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <CardDescription className="line-clamp-1 text-xs">
                            {option.description || "Sem descrição"}
                          </CardDescription>
                          {option.createdBy && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Users className="h-2.5 w-2.5" />
                              {option.createdBy.name || "Alguém"}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="px-3 pb-3 pt-0">
                          {rank != null && (
                            <div className="mb-2 flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <div
                                  key={star}
                                  className={`h-1.5 flex-1 rounded-full ${
                                    star <= rank ? "bg-primary" : "bg-border"
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                                {rank}º
                              </span>
                            </div>
                          )}
                          <div className="flex gap-1">
                            {list?.rankedVoting && !expired && (
                              <select
                                value={rank ?? ""}
                                onChange={(e) => setRank(option.id, e.target.value ? Number(e.target.value) : null)}
                                className="h-6 min-w-0 flex-1 rounded-md border border-input bg-transparent px-1 text-[10px] outline-none focus-visible:border-ring"
                              >
                                <option value="">--</option>
                                {getRankOptions(option.id).map((r) => (
                                  <option key={r.value} value={r.value} disabled={r.disabled}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            {!list?.rankedVoting && !expired && (isParticipant || list?.isPublic) && (
                              <>
                                {myVotes.some((v) => v.optionId === option.id) ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-destructive hover:text-destructive"
                                    onClick={() => removeVoteMutation.mutate(option.id)}
                                    disabled={removeVoteMutation.isPending}
                                  >
                                    <X className="mr-1 h-3 w-3" />
                                    Remover voto
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => voteMutation.mutate(option.id)}
                                    disabled={voteMutation.isPending || (!list.allowMultipleVotes && myVotes.length > 0)}
                                  >
                                    <Check className="mr-1 h-3 w-3" />
                                    Votar
                                  </Button>
                                )}
                              </>
                            )}
                            {canManageOptions && !expired && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOptionMutation.mutate(option.id)}
                                disabled={removeOptionMutation.isPending}
                                className="text-destructive px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </AnimatedCard>
                    )
                  })}
                </div>

                {hasNextOptions && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextOptions()}
                      disabled={fetchingNextOptions}
                    >
                      {fetchingNextOptions ? "Carregando..." : "Carregar mais"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {options.map((option, index) => {
                  const hasVoted = myVotes.some((v) => v.optionId === option.id)
                  return (
                    <AnimatedCard
                      key={option.id}
                      className={`pt-0 ${hasVoted ? "border-primary/50 bg-primary/5" : ""}`}
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                        <div className="group relative overflow-hidden rounded-t-xl">
                          {option.imageUrl ? (
                            <img src={option.imageUrl} alt={option.name} className="aspect-square w-full object-cover" />
                          ) : (
                            <div className="flex aspect-square w-full items-center justify-center bg-muted">
                              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          )}
                          {canManageOptions && !expired && (
                            <button
                              type="button"
                              onClick={() => handleChangeOptionImage(option.id)}
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow transition-opacity hover:bg-background group-hover:opacity-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      <CardHeader className="pb-2 px-3 pt-3">
                        <div className="flex items-start justify-between gap-1">
                          <CardTitle className="text-sm leading-tight">
                            {option.name}
                            {option.referenceUrl && (
                              <a
                                href={option.referenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
                                title={option.referenceUrl}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                {getReferenceLabel(option.referenceUrl)}
                              </a>
                            )}
                          </CardTitle>
                          {canManageOptions && !expired && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditOptionName(option.name)
                                setEditOptionDesc(option.description ?? "")
                                setEditOptionUrl(option.referenceUrl ?? "")
                                setEditOptionId(option.id)
                              }}
                              className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <CardDescription className="line-clamp-1 text-xs">
                          {option.description || "Sem descrição"}
                        </CardDescription>
                        {option.createdBy && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Users className="h-2.5 w-2.5" />
                            {option.createdBy.name || "Alguém"}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="flex gap-1">
                          {!list?.rankedVoting && !expired && (isParticipant || list?.isPublic) && (
                            <>
                              {hasVoted ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-destructive hover:text-destructive"
                                  onClick={() => removeVoteMutation.mutate(option.id)}
                                  disabled={removeVoteMutation.isPending}
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  Remover voto
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => voteMutation.mutate(option.id)}
                                  disabled={voteMutation.isPending || (!list.allowMultipleVotes && myVotes.length > 0)}
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  Votar
                                </Button>
                              )}
                            </>
                          )}
                          {canManageOptions && !expired && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOptionMutation.mutate(option.id)}
                              disabled={removeOptionMutation.isPending}
                              className="text-destructive px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </AnimatedCard>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    {session?.user?.image ? <AvatarImage src={session.user.image} alt={session.user.name ?? ""} /> : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(session?.user?.name ?? "Você")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{session?.user?.name ?? "Você"}</p>
                    <p className="text-xs text-muted-foreground">Criador</p>
                  </div>
                  <Badge variant="outline" className="ml-2">Você</Badge>
                </div>
              </div>

              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between rounded-xl bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {participant.user.imageUrl ? <AvatarImage src={participant.user.imageUrl} alt={participant.user.name ?? ""} /> : null}
                      <AvatarFallback className="text-xs">{getInitials(participant.user.name ?? "?")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{participant.user.name}</p>
                      <p className="text-xs text-muted-foreground">{participant.user.email}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipantMutation.mutate(participant.id)}
                      disabled={removeParticipantMutation.isPending}
                      className="text-destructive"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
              ))}

              {invites.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Convites pendentes</h3>
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between rounded-xl border border-dashed bg-card/50 p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{invite.email}</span>
                          <Badge variant="secondary" className="text-[10px]">Pendente</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelInviteMutation.mutate(invite.id)}
                          disabled={cancelInviteMutation.isPending}
                          className="h-7 text-xs text-destructive"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
