"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Plus,
  Users,
  ArrowLeft,
  Trophy,
  CalendarDays,
  Trash2,
  Check,
  X,
  Settings,
  Eye,
  EyeOff,
  ListOrdered,
  Pencil,
  ExternalLink,
  ImageIcon,
  Share2,
  ArrowRight,
  UserCheck,
  Mail,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"
import {
  createOptionSchema,
  updateListSchema,
  type CreateOptionData,
  type UpdateListData,
} from "@/lib/schemas"
import { useList } from "@/hooks/queries/useList"
import { useOptions } from "@/hooks/queries/useOptions"
import { useParticipants } from "@/hooks/queries/useParticipants"
import { useMyVotes } from "@/hooks/queries/useMyVotes"
import { useInvites } from "@/hooks/queries/useInvites"
import { useFriends } from "@/hooks/queries/useFriends"
import { useCreateOption } from "@/hooks/mutations/useCreateOption"
import { useAddParticipant } from "@/hooks/mutations/useAddParticipant"
import { useRemoveParticipant } from "@/hooks/mutations/useRemoveParticipant"
import { useVote } from "@/hooks/mutations/useVote"
import { useRemoveVote } from "@/hooks/mutations/useRemoveVote"
import { useUpdateList } from "@/hooks/mutations/useUpdateList"
import { useUpdateOptionImage } from "@/hooks/mutations/useUpdateOptionImage"
import { useUpdateOption } from "@/hooks/mutations/useUpdateOption"
import { useRemoveOption } from "@/hooks/mutations/useRemoveOption"
import { useDeleteList } from "@/hooks/mutations/useDeleteList"
import { useSubmitRankedVotes } from "@/hooks/mutations/useSubmitRankedVotes"
import { useCancelInvite } from "@/hooks/mutations/useCancelInvite"
import { ListSkeleton } from "@/components/skeletons/ListSkeleton"

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
  const queryClient = useQueryClient()
  const listId = params.id as string

  const [optionOpen, setOptionOpen] = useState(false)
  const [participantOpen, setParticipantOpen] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [manualEmail, setManualEmail] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)

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
  const { data: friendships } = useFriends(!!session?.user?.id && participantOpen)

  const friends = [
    ...(friendships?.sent ?? []).filter((f) => f.status === "ACCEPTED").map((f) => f.addressee),
    ...(friendships?.received ?? []).filter((f) => f.status === "ACCEPTED").map((f) => f.requester),
  ]

  const cancelInviteMutation = useCancelInvite(listId,
    () => toast.success("Convite cancelado"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao cancelar convite"),
  )

  const settingsForm = useForm<UpdateListData>({
    resolver: zodResolver(updateListSchema),
    defaultValues: {
      name: list?.name ?? "",
      description: list?.description ?? "",
      revealVotes: list?.revealVotes ?? false,
      allowMultipleVotes: list?.allowMultipleVotes ?? false,
      rankedVoting: list?.rankedVoting ?? false,
      maxRank: list?.maxRank ?? 5,
      allowParticipantsToAddOptions: list?.allowParticipantsToAddOptions ?? false,
      isPublic: list?.isPublic ?? false,
    },
  })
  useEffect(() => {
    if (settingsOpen) {
      settingsForm.reset({
        name: list?.name ?? "",
        description: list?.description ?? "",
        revealVotes: list?.revealVotes ?? false,
        allowMultipleVotes: list?.allowMultipleVotes ?? false,
        rankedVoting: list?.rankedVoting ?? false,
        maxRank: list?.maxRank ?? 5,
        allowParticipantsToAddOptions: list?.allowParticipantsToAddOptions ?? false,
        isPublic: list?.isPublic ?? false,
      })
    }
  }, [settingsOpen])

  const watchRankedVotingSettings = settingsForm.watch("rankedVoting")
  const watchMultipleSettings = settingsForm.watch("allowMultipleVotes")
  useEffect(() => {
    if (watchRankedVotingSettings && !watchMultipleSettings) {
      settingsForm.setValue("allowMultipleVotes", true)
    }
  }, [watchRankedVotingSettings, watchMultipleSettings, settingsForm])

  const optionForm = useForm<CreateOptionData>({
    resolver: zodResolver(createOptionSchema),
    defaultValues: { listId, name: "", description: "", referenceUrl: "" },
  })

  const [optionImageUploading, setOptionImageUploading] = useState(false)
  const optionImage = optionForm.watch("image")

  const addOptionMutation = useCreateOption(listId,
    () => {
      optionForm.reset({ listId, name: "", description: "", referenceUrl: "" })
      setOptionOpen(false)
      toast.success("Opção adicionada")
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao adicionar opção"),
  )

  const addParticipantMutation = useAddParticipant(listId,
    (result) => {
      setSelectedEmails([])
      setManualEmail("")
      const parts: string[] = []
      if (result.invited > 0) {
        parts.push(`${result.invited} convite${result.invited > 1 ? "s" : ""} enviado${result.invited > 1 ? "s" : ""}`)
      }
      if (result.errors.length > 0) {
        parts.push(`${result.errors.length} erro${result.errors.length > 1 ? "s" : ""}`)
      }
      toast.success(parts.join(", "))
      setParticipantOpen(false)
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao convidar"),
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

  const updateListMutation = useUpdateList(listId,
    () => {
      setSettingsOpen(false)
      toast.success("Configuração atualizada")
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar configuração"),
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
  const editOptionForm = useForm({
    defaultValues: { name: "", description: "", referenceUrl: "" },
  })

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

  const deleteListMutation = useDeleteList(
    () => {
      setSettingsOpen(false)
      toast.success("Lista deletada")
      router.push("/")
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao deletar lista"),
  )

  const submitRankedMutation = useSubmitRankedVotes(listId, false,
    () => toast.success("Ranking registrado"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao registrar ranking"),
  )

  const [listImageUploading, setListImageUploading] = useState(false)
  const listImage = settingsForm.watch("image")

  const [confirmDelete, setConfirmDelete] = useState(false)

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
                className="absolute inset-0 -top-32 -bottom-32 scale-110 opacity-20 blur-3xl"
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

            {isOwner && (
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger
                  className="inline-flex"
                  render={
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurações da lista</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={settingsForm.handleSubmit(async (data) => {
                      let imageId: string | undefined
                      let imageUrl: string | undefined

                      const imageFile = data.image
                      if (imageFile) {
                        setListImageUploading(true)
                        try {
                          const fd = new FormData()
                          fd.append("file", imageFile)
                          fd.append("type", "list")
                          if (list.imageId) {
                            fd.append("publicId", list.imageId)
                          }

                          const res = await fetch("/api/upload", { method: "POST", body: fd })
                          const result = await res.json()
                          if (!res.ok) throw new Error(result.error || "Erro ao fazer upload")
                          imageId = result.publicId
                          imageUrl = result.secureUrl
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Erro ao fazer upload")
                          setListImageUploading(false)
                          return
                        }
                        setListImageUploading(false)
                      }

                      const { image: _, ...dataWithoutImage } = data
                      updateListMutation.mutate({ ...dataWithoutImage, imageId, imageUrl })
                    })}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="listName">Nome</Label>
                      <Input id="listName" {...settingsForm.register("name")} disabled={updateListMutation.isPending} />
                      {settingsForm.formState.errors.name && (
                        <p className="text-xs text-destructive">{settingsForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="listDescription">Descrição (opcional)</Label>
                      <Textarea id="listDescription" {...settingsForm.register("description")} disabled={updateListMutation.isPending} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="listImage">Imagem de capa (opcional)</Label>
                      <Input
                        id="listImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          settingsForm.setValue("image", file ?? undefined)
                        }}
                        disabled={updateListMutation.isPending || listImageUploading}
                      />
                      {listImage && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                          <img
                            src={URL.createObjectURL(listImage)}
                            alt="Preview"
                            className="h-40 w-full object-cover"
                          />
                        </div>
                      )}
                      {!listImage && list.imageUrl && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                          <img
                            src={list.imageUrl}
                            alt="Capa atual"
                            className="h-40 w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                      <input
                        id="isPublic"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                        {...settingsForm.register("isPublic")}
                        disabled={updateListMutation.isPending}
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="isPublic" className="cursor-pointer font-medium">
                          Lista pública
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Qualquer usuário pode ver e votar sem precisar de convite.
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                      <input
                        id="revealVotes"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                        {...settingsForm.register("revealVotes")}
                        disabled={updateListMutation.isPending}
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="revealVotes" className="cursor-pointer font-medium">
                          Divulgar votos
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Quando ativo, qualquer participante pode ver quem votou em cada opção.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                      <input
                        id="allowMultipleVotes"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                        {...settingsForm.register("allowMultipleVotes")}
                        disabled={updateListMutation.isPending || settingsForm.watch("rankedVoting")}
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="allowMultipleVotes" className={`cursor-pointer font-medium ${settingsForm.watch("rankedVoting") ? "text-muted-foreground" : ""}`}>
                          Permitir votos múltiplos
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {settingsForm.watch("rankedVoting")
                            ? "Sempre ativo para votações por ranking."
                            : "Quando ativo, cada participante pode votar em várias opções. Se desativado, apenas uma opção por participante."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                      <input
                        id="rankedVoting"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                        {...settingsForm.register("rankedVoting")}
                        disabled={updateListMutation.isPending}
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="rankedVoting" className="cursor-pointer font-medium">
                          Votação por ranking
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Participantes rankeiam suas opções favoritas em vez de apenas votar.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                      <input
                        id="allowParticipantsToAddOptions"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                        {...settingsForm.register("allowParticipantsToAddOptions")}
                        disabled={updateListMutation.isPending}
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="allowParticipantsToAddOptions" className="cursor-pointer font-medium">
                          Participantes podem adicionar opções
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Quando ativo, qualquer participante pode adicionar ou remover itens da lista. Se desativado, apenas o criador pode gerenciar as opções.
                        </p>
                      </div>
                    </div>
                    {settingsForm.watch("rankedVoting") && (
                      <div className="space-y-2">
                        <Label htmlFor="maxRank">Máximo de rankings por participante</Label>
                        <Input
                          id="maxRank"
                          type="number"
                          min={1}
                          max={10}
                          {...settingsForm.register("maxRank", { valueAsNumber: true })}
                          disabled={updateListMutation.isPending}
                        />
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {settingsForm.watch("revealVotes") ? (
                        <>
                          <Eye className="h-4 w-4" />
                          Votos estão sendo divulgados
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Votos estão ocultos
                        </>
                      )}
                    </div>
                    <Button type="submit" disabled={updateListMutation.isPending} className="w-full">
                      {updateListMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </form>
                  <Separator />
                  {confirmDelete ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        Tem certeza? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setConfirmDelete(false)}
                          disabled={deleteListMutation.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => deleteListMutation.mutate(listId)}
                          disabled={deleteListMutation.isPending}
                        >
                          {deleteListMutation.isPending ? "Deletando..." : "Deletar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full text-destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar lista
                    </Button>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {(isOwner || (isParticipant && list?.allowParticipantsToAddOptions)) && !expired && (
              <>
                <Dialog open={optionOpen} onOpenChange={setOptionOpen}>
                  <DialogTrigger
                    className="inline-flex"
                    render={
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Opção
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar opção</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={optionForm.handleSubmit(async (data) => {
                        let imageId: string | undefined
                        let imageUrl: string | undefined

                        const imageFile = data.image
                        if (imageFile) {
                          setOptionImageUploading(true)
                          try {
                            const fd = new FormData()
                            fd.append("file", imageFile)
                            fd.append("type", "option")

                            const res = await fetch("/api/upload", { method: "POST", body: fd })
                            const result = await res.json()
                            if (!res.ok) throw new Error(result.error || "Erro ao fazer upload")
                            imageId = result.publicId
                            imageUrl = result.secureUrl
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Erro ao fazer upload")
                            setOptionImageUploading(false)
                            return
                          }
                          setOptionImageUploading(false)
                        }

                        addOptionMutation.mutate({ ...data, referenceUrl: data.referenceUrl || undefined, imageId, imageUrl })
                      })}
                      className="space-y-4"
                    >
                      <input type="hidden" {...optionForm.register("listId")} />
                      <div className="space-y-2">
                        <Label htmlFor="optionName">Nome</Label>
                        <Input
                          id="optionName"
                          placeholder="Ex: O Poderoso Chefão"
                          {...optionForm.register("name")}
                        />
                        {optionForm.formState.errors.name && (
                          <p className="text-xs text-destructive">{optionForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="optionDescription">Descrição (opcional)</Label>
                        <Textarea
                          id="optionDescription"
                          placeholder="Informações adicionais sobre a opção"
                          {...optionForm.register("description")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="optionImage">Imagem (opcional)</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="optionImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null
                              optionForm.setValue("image", file ?? undefined)
                            }}
                            disabled={optionImageUploading}
                          />
                        </div>
                        {optionImage && (
                          <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                            <img
                              src={URL.createObjectURL(optionImage)}
                              alt="Preview"
                              className="h-40 w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="optionReferenceUrl">Link de referência (opcional)</Label>
                        <Input
                          id="optionReferenceUrl"
                          type="url"
                          placeholder="https://www.imdb.com/title/tt0068646/"
                          {...optionForm.register("referenceUrl")}
                        />
                        {(optionForm.watch("referenceUrl") ?? "") && (
                          <p className="text-xs text-muted-foreground">
                            {getReferenceLabel(optionForm.watch("referenceUrl") ?? "")}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={addOptionMutation.isPending || optionImageUploading}>
                        {optionImageUploading ? "Enviando imagem..." : addOptionMutation.isPending ? "Adicionando..." : "Adicionar opção"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={participantOpen} onOpenChange={(open) => {
                  setParticipantOpen(open)
                  if (!open) {
                    setSelectedEmails([])
                    setManualEmail("")
                  }
                }}>
                  <DialogTrigger
                    className="inline-flex"
                    render={
                      <Button>
                        <Users className="mr-2 h-4 w-4" />
                        Participante
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Convidar participantes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Adicionar por email</Label>
                        <div className="flex gap-2">
                          <Input
                            className="min-w-0 flex-1"
                            placeholder="email@convidado.com"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && manualEmail.includes("@")) {
                                e.preventDefault()
                                if (!selectedEmails.includes(manualEmail)) {
                                  setSelectedEmails((prev) => [...prev, manualEmail])
                                }
                                setManualEmail("")
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => {
                              if (manualEmail.includes("@") && !selectedEmails.includes(manualEmail)) {
                                setSelectedEmails((prev) => [...prev, manualEmail])
                                setManualEmail("")
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {friends.length > 0 && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5" />
                            Amigos
                          </Label>
                          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-1">
                            {friends.map((friend) => {
                              const isSelected = selectedEmails.includes(friend.email ?? "")
                              return (
                                <button
                                  key={friend.id}
                                  type="button"
                                  onClick={() => {
                                    if (!friend.email) return
                                    setSelectedEmails((prev) =>
                                      isSelected
                                        ? prev.filter((e) => e !== friend.email)
                                        : [...prev, friend.email!],
                                    )
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                                    isSelected
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-secondary/50"
                                  }`}
                                >
                                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-secondary text-secondary-foreground"
                                  }`}>
                                    {(friend.name?.[0] ?? friend.email?.[0] ?? "?").toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{friend.name || "Usuário"}</p>
                                    <p className="truncate text-xs text-muted-foreground">{friend.email}</p>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {selectedEmails.length > 0 && (
                        <div className="space-y-2">
                          <Label>Selecionados ({selectedEmails.length})</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedEmails.map((email) => (
                              <Badge
                                key={email}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {email}
                                <button
                                  type="button"
                                  onClick={() => setSelectedEmails((prev) => prev.filter((e) => e !== email))}
                                  className="ml-0.5 rounded-full p-0.5 hover:bg-secondary-foreground/10"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full gap-1.5"
                        onClick={() => addParticipantMutation.mutate(selectedEmails)}
                        disabled={addParticipantMutation.isPending || selectedEmails.length === 0}
                      >
                        {addParticipantMutation.isPending ? (
                          "Convidando..."
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            Convidar {selectedEmails.length > 0 && `(${selectedEmails.length})`}
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                                  editOptionForm.reset({ name: option.name, description: option.description ?? "", referenceUrl: option.referenceUrl ?? "" })
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
                            <div className="mt-1 flex items-center gap-1">
                              <Avatar size="sm">
                                {option.createdBy.imageUrl && <AvatarImage src={option.createdBy.imageUrl} alt={option.createdBy.name ?? ""} />}
                                <AvatarFallback className="text-[8px]">{getInitials(option.createdBy.name ?? "?")}</AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-muted-foreground">{option.createdBy.name}</span>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="px-3 pb-3 pt-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {option._count?.votes ?? 0} voto{(option._count?.votes ?? 0) !== 1 ? "s" : ""}
                            </span>
                            {!list.rankedVoting && (isParticipant || list?.isPublic) && !expired && (
                              option._count?.isVotedByMe ? (
                                <button
                                  onClick={() => removeVoteMutation.mutate(option.id)}
                                  disabled={removeVoteMutation.isPending}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                >
                                  {removeVoteMutation.isPending ? (
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => voteMutation.mutate(option.id)}
                                  disabled={voteMutation.isPending || (!list.allowMultipleVotes && myVotes.length > 0)}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                  {voteMutation.isPending ? (
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </button>
                              )
                            )}
                            {list.rankedVoting && (isParticipant || list?.isPublic) && !expired && (
                              <div className="flex items-center gap-0.5">
                                {getRankOptions(option.id).map((r) => (
                                  <button
                                    key={r.value}
                                    onClick={() => setRank(option.id, rank === r.value ? null : r.value)}
                                    disabled={r.disabled && rank !== r.value}
                                    className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium transition-all ${
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
                                    onClick={() => setRank(option.id, null)}
                                    className="flex h-5 w-5 items-center justify-center rounded bg-destructive/10 text-[10px] font-medium text-destructive hover:bg-destructive/20"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </AnimatedCard>
                    )
                  })}
                </div>

                {optionsLoading && (
                  <div className="mt-4 flex justify-center">
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                )}
                {hasNextOptions && !optionsLoading && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextOptions()}
                      disabled={fetchingNextOptions}
                    >
                      {fetchingNextOptions ? "Carregando..." : "Carregar mais opções"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {options.map((option, index) => (
                  <AnimatedCard
                    key={option.id}
                    className="pt-0"
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
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                editOptionForm.reset({ name: option.name, description: option.description ?? "", referenceUrl: option.referenceUrl ?? "" })
                                setEditOptionId(option.id)
                              }}
                              className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remover "${option.name}"?`)) {
                                  removeOptionMutation.mutate(option.id)
                                }
                              }}
                              className="shrink-0 rounded-md p-0.5 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <CardDescription className="line-clamp-1 text-xs">
                        {option.description || "Sem descrição"}
                      </CardDescription>
                      {option.createdBy && (
                        <div className="mt-1 flex items-center gap-1">
                          <Avatar size="sm">
                            {option.createdBy.imageUrl && <AvatarImage src={option.createdBy.imageUrl} alt={option.createdBy.name ?? ""} />}
                            <AvatarFallback className="text-[8px]">{getInitials(option.createdBy.name ?? "?")}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-muted-foreground">{option.createdBy.name}</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {option._count?.votes ?? 0} voto{(option._count?.votes ?? 0) !== 1 ? "s" : ""}
                        </span>
                        {!list.rankedVoting && (isParticipant || list?.isPublic) && !expired && (
                          option._count?.isVotedByMe ? (
                            <button
                              onClick={() => removeVoteMutation.mutate(option.id)}
                              disabled={removeVoteMutation.isPending}
                              className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            >
                              {removeVoteMutation.isPending ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => voteMutation.mutate(option.id)}
                              disabled={voteMutation.isPending || (!list.allowMultipleVotes && myVotes.length > 0)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              {voteMutation.isPending ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>
            )}

            {editOptionId && editOption && (
              <Dialog open={!!editOptionId} onOpenChange={(o) => { if (!o) { setEditOptionId(null); editOptionForm.reset({ name: "", description: "" }) } }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar opção</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={editOptionForm.handleSubmit((data) => {
                      updateOptionMutation.mutate({
                        optionId: editOptionId,
                        name: data.name,
                        description: data.description || undefined,
                        referenceUrl: data.referenceUrl || undefined,
                      })
                    })}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="editOptionName">Nome</Label>
                      <Input id="editOptionName" {...editOptionForm.register("name")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editOptionDescription">Descrição (opcional)</Label>
                      <Textarea id="editOptionDescription" {...editOptionForm.register("description")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editOptionUrl">Link de referência (opcional)</Label>
                      <Input id="editOptionUrl" type="url" {...editOptionForm.register("referenceUrl")} />
                    </div>
                    <Button type="submit" className="w-full" disabled={updateOptionMutation.isPending}>
                      {updateOptionMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
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
