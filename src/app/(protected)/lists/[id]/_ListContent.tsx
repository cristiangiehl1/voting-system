"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
} from "lucide-react"
import { api } from "@/lib/api-client"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"
import {
  createOptionSchema,
  inviteSchema,
  updateListSchema,
  type CreateOptionData,
  type InviteData,
  type UpdateListData,
} from "@/lib/schemas"

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
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { data: list } = useQuery({
    queryKey: queryKeys.list(listId),
    queryFn: () => api.getList(listId),
    enabled: !!listId,
  })

  const { data: optionsData, isPending: optionsLoading, fetchNextPage: fetchNextOptions, hasNextPage: hasNextOptions, isFetchingNextPage: fetchingNextOptions } = useInfiniteQuery({
    queryKey: queryKeys.options(listId),
    queryFn: ({ pageParam }) => api.getOptionsPaginated(listId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!listId,
  })
  const options = optionsData?.pages.flatMap(p => p.items) ?? []

  const { data: participants = [] } = useQuery({
    queryKey: queryKeys.participants(listId),
    queryFn: () => api.getParticipants(listId),
    enabled: !!listId,
  })

  const { data: myVotes = [] } = useQuery({
    queryKey: queryKeys.myVotes(listId),
    queryFn: () => api.getMyVotes(listId),
    enabled: !!listId && !!session?.user?.id,
  })

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

  const { data: invites = [] } = useQuery({
    queryKey: queryKeys.invites(listId),
    queryFn: () => api.getInvites(listId),
    enabled: !!listId && isOwner,
  })

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await api.cancelInvite(inviteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites(listId) })
      toast.success("Convite cancelado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao cancelar convite"),
  })

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

  const participantForm = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { listId, email: "" },
  })

  const [optionImageUploading, setOptionImageUploading] = useState(false)
  const optionImage = optionForm.watch("image")

  const addOptionMutation = useMutation({
    mutationFn: async (data: CreateOptionData & { imageId?: string; imageUrl?: string }) => {
      await api.createOption(data.listId, { name: data.name, description: data.description, referenceUrl: data.referenceUrl, imageId: data.imageId, imageUrl: data.imageUrl })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      optionForm.reset({ listId, name: "", description: "", referenceUrl: "" })
      setOptionOpen(false)
      toast.success("Opção adicionada")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao adicionar opção"),
  })

  const addParticipantMutation = useMutation({
    mutationFn: async (data: InviteData) => {
      await api.inviteParticipant(data.listId, data.email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) })
      participantForm.reset({ listId, email: "" })
      setParticipantOpen(false)
      toast.success("Convite enviado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao convidar"),
  })

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      await api.removeParticipant(listId, participantId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) })
      toast.success("Participante removido")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover participante"),
  })

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      await api.vote(optionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      toast.success("Voto registrado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao votar"),
  })

  const removeVoteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      await api.removeVote(optionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      toast.success("Voto removido")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover voto"),
  })

  const updateListMutation = useMutation({
    mutationFn: async (data: UpdateListData & { imageId?: string; imageUrl?: string }) => {
      await api.updateList(listId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      setSettingsOpen(false)
      toast.success("Configuração atualizada")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar configuração"),
  })

  const updateOptionImageMutation = useMutation({
    mutationFn: async ({ optionId, imageId, imageUrl }: { optionId: string; imageId: string; imageUrl: string }) => {
      await api.updateOptionImage(optionId, imageId, imageUrl)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      toast.success("Imagem atualizada")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar imagem"),
  })

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
  const [editImageUploading, setEditImageUploading] = useState(false)
  const [editOptionImageFile, setEditOptionImageFile] = useState<File | null>(null)
  const editOption = options.find((o) => o.id === editOptionId)
  const editOptionForm = useForm({
    defaultValues: { name: "", description: "", referenceUrl: "" },
  })

  const updateOptionMutation = useMutation({
    mutationFn: async (data: { optionId: string; name: string; description?: string; referenceUrl?: string; imageId?: string; imageUrl?: string }) => {
      await api.updateOption(data.optionId, {
        name: data.name,
        description: data.description,
        referenceUrl: data.referenceUrl,
        imageId: data.imageId,
        imageUrl: data.imageUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      setEditOptionId(null)
      toast.success("Opção atualizada")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar opção"),
    onSettled: () => {
      editOptionForm.reset({ name: "", description: "" })
    },
  })

  const removeOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      await api.removeOption(optionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      toast.success("Opção removida")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover opção"),
  })

  const deleteListMutation = useMutation({
    mutationFn: async () => {
      await api.deleteList(listId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      setSettingsOpen(false)
      toast.success("Lista deletada")
      router.push("/")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao deletar lista"),
  })

  const submitRankedMutation = useMutation({
    mutationFn: async (rankings: Array<{ optionId: string; rank: number }>) => {
      await api.submitRankedVotes(listId, rankings)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      toast.success("Ranking registrado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao registrar ranking"),
  })

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
  }, [myVotes])

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
    return (
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="aspect-square w-full max-w-md animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-4">
            <div className="h-4 w-32 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-44 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl bg-card">
              <div className="aspect-square w-full animate-pulse bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
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
                <ListChecksIcon />
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
                          onClick={() => deleteListMutation.mutate()}
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

                <Dialog open={participantOpen} onOpenChange={setParticipantOpen}>
                  <DialogTrigger
                    className="inline-flex"
                    render={
                      <Button>
                        <Users className="mr-2 h-4 w-4" />
                        Participante
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Convidar participante</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={participantForm.handleSubmit((data) => addParticipantMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <input type="hidden" {...participantForm.register("listId")} />
                      <div className="space-y-2">
                        <Label htmlFor="participantEmail">Email do usuário</Label>
                        <Input
                          id="participantEmail"
                          type="email"
                          placeholder="email@convidado.com"
                          {...participantForm.register("email")}
                        />
                        {participantForm.formState.errors.email && (
                          <p className="text-xs text-destructive">{participantForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={addParticipantMutation.isPending}>
                        {addParticipantMutation.isPending ? "Convidando..." : "Convidar"}
                      </Button>
                    </form>
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
                          <div className="mb-2">
                            <span className="text-[10px] font-medium text-muted-foreground">
                              Posição
                            </span>
                            <div className="mt-0.5 flex flex-wrap gap-0.5">
                              {getRankOptions(option.id).map((r) => (
                                <button
                                  key={r.value}
                                  type="button"
                                  onClick={() => setRank(option.id, rank === r.value ? null : r.value)}
                                  disabled={r.disabled && rank !== r.value}
                                  className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium transition-all ${
                                    rank === r.value
                                      ? "bg-primary text-primary-foreground shadow-sm"
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
                                  className="flex h-6 w-6 items-center justify-center rounded bg-destructive/10 text-[10px] font-medium text-destructive hover:bg-destructive/20"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {list.revealVotes && option.votes && option.votes.length > 0 && (
                            <div className="mb-2">
                              <p className="mb-1 text-xs font-medium text-muted-foreground">Votaram:</p>
                              <div className="flex flex-wrap gap-1">
                                {option.votes.map((vote: any) => {
                                  const displayName = vote.voter.name || vote.voter.email || "Anônimo"
                                  return (
                                    <Avatar key={vote.voter.id} size="sm" title={displayName}>
                                      {vote.voter.imageUrl && <AvatarImage src={vote.voter.imageUrl} alt={displayName} />}
                                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                                    </Avatar>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          {canManageOptions && !expired && (
                            <button
                              type="button"
                              onClick={() => removeOptionMutation.mutate(option.id)}
                              disabled={removeOptionMutation.isPending}
                              className="mt-1 w-full rounded text-[10px] text-destructive hover:bg-destructive/10 transition-colors py-1"
                            >
                              Remover
                            </button>
                          )}
                        </CardContent>
                      </AnimatedCard>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {options.map((option, index) => {
                  const voted = myVotes.some((v) => v.optionId === option.id)
                  return (
                    <AnimatedCard
                      key={option.id}
                      className={`pt-0 ${voted ? "border-primary/50 bg-primary/5" : ""}`}
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
                        <div className="mb-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Trophy className="h-3 w-3" />
                          {option._count.votes} voto{option._count.votes !== 1 ? "s" : ""}
                        </div>
                        {list.revealVotes && option.votes && option.votes.length > 0 && (
                          <div className="mb-2">
                            <p className="mb-1 text-xs font-medium text-muted-foreground">Votaram:</p>
                            <div className="flex flex-wrap gap-1">
                              {option.votes.map((vote: any) => {
                                  const displayName = vote.voter.name || vote.voter.email || "Anônimo"
                                  return (
                                    <Avatar key={vote.voter.id} size="sm" title={displayName}>
                                      {vote.voter.imageUrl && <AvatarImage src={vote.voter.imageUrl} alt={displayName} />}
                                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                                    </Avatar>
                                  )
                                })}
                            </div>
                          </div>
                        )}
                        {session && (isParticipant || list?.isPublic) && !expired && (
                          <div className="mb-1">
                            {voted ? (
                              <button
                                type="button"
                                onClick={() => removeVoteMutation.mutate(option.id)}
                                disabled={removeVoteMutation.isPending}
                                className="w-full rounded bg-secondary py-1 text-[11px] font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                              >
                                Remover voto
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => voteMutation.mutate(option.id)}
                                disabled={
                                  voteMutation.isPending ||
                                  (!list.allowMultipleVotes && myVotes.length > 0)
                                }
                                className="w-full rounded bg-primary py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                              >
                                Votar
                              </button>
                            )}
                            {!list.allowMultipleVotes && myVotes.length > 0 && !voted && (
                              <p className="mt-1 text-center text-[10px] text-muted-foreground">
                                Você já votou.
                              </p>
                            )}
                          </div>
                        )}
                        {canManageOptions && !expired && (
                          <button
                            type="button"
                            onClick={() => removeOptionMutation.mutate(option.id)}
                            disabled={removeOptionMutation.isPending}
                            className="mt-1 w-full rounded text-[10px] text-destructive hover:bg-destructive/10 transition-colors py-1"
                          >
                            Remover
                          </button>
                        )}
                        {session && !isParticipant && !isOwner && !list?.isPublic && (
                          <p className="text-[10px] text-muted-foreground">
                            Apenas participantes podem votar.
                          </p>
                        )}
                        {session && !isParticipant && !isOwner && list?.isPublic && (
                          <p className="text-[10px] text-muted-foreground">
                            Vote para participar.
                          </p>
                        )}
                      </CardContent>
                    </AnimatedCard>
                  )
                })}
              </div>
            )}

            {hasNextOptions && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => fetchNextOptions()}
                  disabled={fetchingNextOptions}
                >
                  {fetchingNextOptions ? "Carregando..." : "Carregar mais opções"}
                </Button>
              </div>
            )}

            <Dialog open={!!editOptionId} onOpenChange={(open) => { if (!open) setEditOptionId(null) }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar opção</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={editOptionForm.handleSubmit(async (data) => {
                    let imageId: string | undefined
                    let imageUrl: string | undefined

                    if (editOptionImageFile) {
                      setEditImageUploading(true)
                      try {
                        const fd = new FormData()
                        fd.append("file", editOptionImageFile)
                        fd.append("type", "option")
                        if (editOption?.imageId) {
                          fd.append("publicId", editOption.imageId)
                        }

                        const res = await fetch("/api/upload", { method: "POST", body: fd })
                        const result = await res.json()
                        if (!res.ok) throw new Error(result.error || "Erro ao fazer upload")
                        imageId = result.publicId
                        imageUrl = result.secureUrl
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Erro ao fazer upload")
                        setEditImageUploading(false)
                        return
                      }
                      setEditImageUploading(false)
                    }

                    updateOptionMutation.mutate({
                      optionId: editOptionId!,
                      name: data.name,
                      description: data.description || undefined,
                      referenceUrl: data.referenceUrl || undefined,
                      imageId,
                      imageUrl,
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
                    <Label htmlFor="editOptionImage">Imagem (opcional)</Label>
                    <Input
                      id="editOptionImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditOptionImageFile(e.target.files?.[0] ?? null)}
                      disabled={editImageUploading}
                    />
                    {editOptionImageFile ? (
                      <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                        <img
                          src={URL.createObjectURL(editOptionImageFile)}
                          alt="Preview"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : editOption?.imageUrl ? (
                      <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                        <img src={editOption.imageUrl} alt="Atual" className="h-40 w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editOptionReferenceUrl">Link de referência (opcional)</Label>
                    <Input
                      id="editOptionReferenceUrl"
                      type="url"
                      placeholder="https://www.imdb.com/title/tt0068646/"
                      {...editOptionForm.register("referenceUrl")}
                    />
                    {(editOptionForm.watch("referenceUrl") ?? "") && (
                      <p className="text-xs text-muted-foreground">
                        {getReferenceLabel(editOptionForm.watch("referenceUrl") ?? "")}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={updateOptionMutation.isPending || editImageUploading}>
                    {editImageUploading ? "Enviando imagem..." : updateOptionMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="participants" className="mt-4">
            <AnimatedCard>
              <CardHeader>
                <CardTitle className="text-lg">Participantes</CardTitle>
                <CardDescription>
                  Pessoas convidadas para votar nesta lista. O criador também pode votar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {list.createdBy.imageUrl && <AvatarImage src={list.createdBy.imageUrl} alt={list.createdBy.name || "Criador"} />}
                        <AvatarFallback>{getInitials(list.createdBy.name || "Criador")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{list.createdBy.name || "Criador"}</p>
                        <p className="text-xs text-muted-foreground">{list.createdBy.email}</p>
                      </div>
                    </div>
                    <Badge>Criador</Badge>
                  </li>
                  {participants.map((participant) => {
                    const displayName = participant.user.name || "Sem nome"
                    return (
                    <li
                      key={participant.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {participant.user.imageUrl && <AvatarImage src={participant.user.imageUrl} alt={displayName} />}
                          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{participant.user.email}</p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeParticipantMutation.mutate(participant.id)}
                          disabled={removeParticipantMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </li>
                    )
                  })}
                </ul>

                {isOwner && invites.filter((inv) => inv.status === "PENDING").length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                      Convites pendentes
                    </h4>
                    <ul className="space-y-2">
                      {invites.filter((inv) => inv.status === "PENDING").map((invite) => (
                        <li
                          key={invite.id}
                          className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{invite.email}</p>
                            <p className="text-xs text-muted-foreground/60">
                              Convidado em {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => cancelInviteMutation.mutate(invite.id)}
                            disabled={cancelInviteMutation.isPending}
                          >
                            Cancelar
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </AnimatedCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}

function ListChecksIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 12h8" />
      <path d="M11 18h8" />
      <path d="M11 6h8" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
      <path d="M3 6h.01" />
    </svg>
  )
}
