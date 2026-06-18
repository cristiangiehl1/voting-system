"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Skull,
  Trophy,
  Users,
  Plus,
  Frown,
  Swords,
  Sparkles,
  ListPlus,
  Share2,
  Activity,
} from "lucide-react"
import { ThreeBackground } from "@/components/ThreeBackground"
import { getCandidates, getLabels, getMyVotes, getRankings } from "@/app/actions/votes"
import { getRecentActivity } from "@/app/actions/activity"
import { fetchRandomMeme } from "@/lib/meme"
import { queryKeys } from "@/lib/query-keys"
import { createRankingSchema, createCandidateSchema, type CreateRankingData, type CreateCandidateData } from "@/lib/schemas"
import { useVoteConfetti, useAchievementToast, useFloatingEmojis, MemeReaction } from "@/components/VoteEffects"
import { FloatingEmojis } from "@/components/FloatingEmojis"
import { AnimatedVoteCount } from "@/components/AnimatedVoteCount"
import gsap from "gsap"

type Candidate = Awaited<ReturnType<typeof getCandidates>>[number]
type Label = Awaited<ReturnType<typeof getLabels>>[number]
type Ranking = Awaited<ReturnType<typeof getRankings>>[number]

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "agora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days}d`
  return `há ${Math.floor(days / 30)} meses`
}

const LABEL_EMOJIS: Record<string, string> = {
  "Reclama de problemas inexistentes": "🔍",
  "O problema desaparece quando vou na máquina": "👻",
  "Não sabe descrever o problema": "🤷",
  "Liga 5x no mesmo dia": "📞",
  "Problema é sempre 'urgente'": "🔥",
  "Print da tela? O que é isso?": "📸",
  "Senha errada 10x seguidas": "🔑",
  "O problema é sempre 'o sistema'": "💻",
  "Manda e-mail às 23h": "🌙",
  "Meu primo que entende de TI disse": "👨‍💻",
}

export default function Home() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [selectedRankingId, setSelectedRankingId] = useState<string>("")
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string[]>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [showCreateRanking, setShowCreateRanking] = useState(false)
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [reactionMeme, setReactionMeme] = useState<string | null>(null)
  const [showActivity, setShowActivity] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const fireConfetti = useVoteConfetti()
  const showAchievementToast = useAchievementToast()
  const emojis = useFloatingEmojis()

  const rankingForm = useForm<CreateRankingData>({
    resolver: zodResolver(createRankingSchema),
    defaultValues: { name: "", description: "" },
  })

  const candidateForm = useForm<CreateCandidateData>({
    resolver: zodResolver(createCandidateSchema),
    defaultValues: { name: "", email: "", rankingId: "" },
  })

  const { data: rankings = [] } = useQuery({
    queryKey: queryKeys.rankings,
    queryFn: getRankings,
  })

  const activeRankingId = selectedRankingId || rankings[0]?.id || ""

  const { data: candidates = [] } = useQuery({
    queryKey: queryKeys.candidates(activeRankingId),
    queryFn: () => getCandidates(activeRankingId),
    enabled: !!activeRankingId,
  })

  const { data: labels = [] } = useQuery({
    queryKey: queryKeys.labels,
    queryFn: getLabels,
  })

  const { data: myVotes = [] } = useQuery({
    queryKey: queryKeys.myVotes(activeRankingId),
    queryFn: () => getMyVotes(activeRankingId),
    enabled: !!activeRankingId,
  })

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["activity", activeRankingId],
    queryFn: () => getRecentActivity(activeRankingId),
    enabled: !!activeRankingId,
    refetchInterval: 15000,
  })

  useEffect(() => {
    if (myVotes.length === 0) return
    const labels: Record<string, string[]> = {}
    const comms: Record<string, string> = {}
    for (const v of myVotes) {
      labels[v.candidateId] = v.voteLabels.map((vl) => vl.labelId)
      if (v.comment) comms[v.candidateId] = v.comment
    }
    setSelectedLabels((prev) => ({ ...prev, ...labels }))
    setComments((prev) => ({ ...prev, ...comms }))
  }, [myVotes])

  const voteMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          comment: comments[candidateId] || "",
          labelIds: selectedLabels[candidateId] || [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao votar")
      }
      return data
    },
    onSuccess: (data) => {
      fireConfetti()
      emojis.trigger()
      if (data.achievements?.length > 0) {
        showAchievementToast(data.achievements)
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates(activeRankingId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(activeRankingId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard(activeRankingId) })
      queryClient.invalidateQueries({ queryKey: ["activity", activeRankingId] })
      fetchRandomMeme().then(setReactionMeme)
      toast.success("Voto registrado!", { style: { border: "1px solid #00f0ff", color: "#00f0ff" } })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao votar"),
  })

  const updateLabelsMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const res = await fetch("/api/votes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          comment: comments[candidateId] || "",
          labelIds: selectedLabels[candidateId] || [],
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao atualizar tags")
      }
    },
    onSuccess: () => {
      fireConfetti()
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates(activeRankingId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(activeRankingId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard(activeRankingId) })
      queryClient.invalidateQueries({ queryKey: ["activity", activeRankingId] })
      fetchRandomMeme().then(setReactionMeme)
      toast.success("Tags atualizadas!", { style: { border: "1px solid #00f0ff", color: "#00f0ff" } })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar tags"),
  })

  const addCandidateMutation = useMutation({
    mutationFn: async (data: CreateCandidateData) => {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, email: data.email || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao adicionar candidato")
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates(variables.rankingId) })
      toast.success("Candidato adicionado!", { style: { border: "1px solid #00f0ff", color: "#00f0ff" } })
      candidateForm.reset()
      setShowAddCandidate(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao adicionar candidato"),
  })

  const createRankingMutation = useMutation({
    mutationFn: async (data: CreateRankingData) => {
      const res = await fetch("/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar ranking")
      }
      return (await res.json()).id as string
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rankings })
      setSelectedRankingId(id)
      rankingForm.reset()
      setShowCreateRanking(false)
      toast.success("Ranking criado!", { style: { border: "1px solid #00f0ff", color: "#00f0ff" } })
    },
    onError: (error) => {
      console.error("createRanking error:", error)
      toast.error(error instanceof Error ? error.message : JSON.stringify(error))
    },
  })

  useEffect(() => {
    if (rankings.length > 0 && !selectedRankingId) {
      setSelectedRankingId(rankings[0].id)
    }
  }, [rankings, selectedRankingId])

  useEffect(() => {
    if (!heroRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current!.querySelectorAll(".anim-up"), {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out",
      })
      gsap.from(heroRef.current!.querySelectorAll(".anim-scale"), {
        scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)",
      })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!cardsRef.current || candidates.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 30, opacity: 0, duration: 0.4, stagger: 0.05, ease: "power1.out", delay: 0.1,
      })
    })
    return () => ctx.revert()
  }, [candidates])

  function toggleLabel(candidateId: string, labelId: string) {
    setSelectedLabels((prev) => {
      const current = prev[candidateId] || []
      return { ...prev, [candidateId]: current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId] }
    })
  }

  const hasVotedFor = useCallback(
    (candidateId: string) => myVotes.some((v) => v.candidateId === candidateId),
    [myVotes]
  )

  return (
    <>
      <ThreeBackground />
      <div className="relative">
        <div ref={heroRef} className="container mx-auto px-4 pt-16 pb-8 text-center">
          <div className="anim-scale mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neon-magenta/10 ring-2 ring-neon-cyan/30">
            <Skull className="h-10 w-10 text-neon-magenta" />
          </div>
          <h1 className="anim-up text-5xl font-black tracking-tighter uppercase sm:text-7xl">
            <span className="gradient-text">TI Chatômetro</span>
          </h1>
          <p className="anim-up mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            O ranking definitivo dos usuários mais <span className="text-neon-cyan">inconvenientes</span> do suporte de TI.
          </p>
        </div>

        <div className="container mx-auto px-4 pb-6">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <Select value={activeRankingId} onValueChange={(v) => v && setSelectedRankingId(v)}>
              <SelectTrigger className="flex-1 border-neon-cyan/30 bg-background/50 text-foreground">
                <SelectValue placeholder="Selecione um ranking" />
              </SelectTrigger>
              <SelectContent className="border-neon-cyan/20 bg-background">
                {rankings.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({r._count.candidates})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showCreateRanking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateRanking(false)}>
                <div className="w-full max-w-md rounded-lg border border-neon-cyan/30 bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="mb-4 text-lg font-bold gradient-text">Novo Ranking</h3>
                  <form
                    onSubmit={rankingForm.handleSubmit((data) => createRankingMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <input
                      placeholder="Nome do ranking"
                      className="flex h-10 w-full rounded-md border border-neon-cyan/30 bg-background/50 px-3 py-2 text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 focus:outline-none"
                      {...rankingForm.register("name")}
                    />
                    {rankingForm.formState.errors.name && (
                      <p className="text-xs text-neon-magenta">{rankingForm.formState.errors.name.message}</p>
                    )}
                    <input
                      placeholder="Descrição (opcional)"
                      className="flex h-10 w-full rounded-md border border-neon-cyan/30 bg-background/50 px-3 py-2 text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 focus:outline-none"
                      {...rankingForm.register("description")}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20" disabled={createRankingMutation.isPending}>
                        {createRankingMutation.isPending ? "Criando..." : "Criar Ranking"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowCreateRanking(false)} className="text-muted-foreground">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <button
              onClick={() => { rankingForm.reset(); setShowCreateRanking(true) }}
              className="shrink-0 inline-flex items-center justify-center rounded-md border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 h-9 w-9"
            >
              <ListPlus className="h-4 w-4" />
            </button>

            <Link href={`/ranking?rankingId=${activeRankingId}`}>
              <Button variant="outline" size="icon" className="shrink-0 border-neon-magenta/50 text-neon-magenta hover:bg-neon-magenta/20">
                <Trophy className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="border-neon-cyan/10" />

        {activeRankingId && (
          <div className="container mx-auto px-4 py-12">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Users className="h-6 w-6 text-neon-cyan" />
                <span className="gradient-text">Candidatos</span>
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                  {candidates.length} usuários
                </Badge>
                {session && (
                  <Button
                    size="sm"
                    onClick={() => { candidateForm.setValue("rankingId", activeRankingId); setShowAddCandidate(true) }}
                    className="border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta hover:bg-neon-magenta/20"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Adicionar
                  </Button>
                )}
              </div>
            </div>

            {showAddCandidate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCandidate(false)}>
                <div className="w-full max-w-md rounded-lg border border-neon-magenta/30 bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="mb-4 text-lg font-bold gradient-text">Adicionar Candidato</h3>
                  <form
                    onSubmit={candidateForm.handleSubmit((data) => addCandidateMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Ranking</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-neon-cyan/30 bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 focus:outline-none"
                        {...candidateForm.register("rankingId")}
                      >
                        {rankings.map((r) => (
                          <option key={r.id} value={r.id} className="bg-background text-foreground">
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {candidateForm.formState.errors.rankingId && (
                        <p className="text-xs text-neon-magenta">{candidateForm.formState.errors.rankingId.message}</p>
                      )}
                    </div>
                    <input
                      placeholder="Nome do usuário"
                      className="flex h-10 w-full rounded-md border border-neon-cyan/30 bg-background/50 px-3 py-2 text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 focus:outline-none"
                      {...candidateForm.register("name")}
                    />
                    {candidateForm.formState.errors.name && (
                      <p className="text-xs text-neon-magenta">{candidateForm.formState.errors.name.message}</p>
                    )}
                    <input
                      type="email"
                      placeholder="Email (opcional)"
                      className="flex h-10 w-full rounded-md border border-neon-cyan/30 bg-background/50 px-3 py-2 text-sm focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50 focus:outline-none"
                      {...candidateForm.register("email")}
                    />
                    {candidateForm.formState.errors.email && (
                      <p className="text-xs text-neon-magenta">{candidateForm.formState.errors.email.message}</p>
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta hover:bg-neon-magenta/20" disabled={addCandidateMutation.isPending}>
                        {addCandidateMutation.isPending ? "Adicionando..." : "Adicionar"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => { candidateForm.reset(); setShowAddCandidate(false) }} className="text-muted-foreground">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div ref={cardsRef} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {candidates.map((candidate) => {
                const voted = hasVotedFor(candidate.id)
                return (
                  <Card
                    key={candidate.id}
                    className={`bg-card/60 backdrop-blur-sm ${
                      voted ? "border-neon-green/30 bg-neon-green/5" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-neon-cyan/30">
                          {candidate.avatar ? <AvatarImage src={candidate.avatar} alt="meme" /> : null}
                          <AvatarFallback className="bg-neon-magenta/20 text-neon-magenta text-lg">
                            {candidate.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate text-base">{candidate.name}</CardTitle>
                          <Badge
                            variant={voted ? "default" : "secondary"}
                            className={`mt-1 text-[10px] ${
                              voted
                                ? "bg-neon-green/20 text-neon-green border-neon-green/30"
                                : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20"
                            }`}
                          >
                            <AnimatedVoteCount count={candidate._count.votes} className="inline" /> voto{candidate._count.votes !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Labels de inconveniência:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {labels.map((label) => {
                              const isSelected = (selectedLabels[candidate.id] || []).includes(label.id)
                              return (
                                <Badge
                                  key={label.id}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer text-[10px] transition-all hover:scale-105 ${
                                    isSelected
                                      ? "bg-neon-magenta/20 text-neon-magenta border-neon-magenta/40"
                                      : "border-neon-cyan/20 text-muted-foreground hover:border-neon-cyan/40 hover:text-neon-cyan"
                                  }`}
                                  onClick={() => toggleLabel(candidate.id, label.id)}
                                >
                                  {LABEL_EMOJIS[label.name] || "🏷️"} {label.name}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                        <Textarea
                          placeholder="Comentário (opcional)..."
                          value={comments[candidate.id] || ""}
                          onChange={(e) => setComments((prev) => ({ ...prev, [candidate.id]: e.target.value }))}
                          className="min-h-[56px] border-neon-cyan/20 bg-background/50 text-sm placeholder:text-muted-foreground focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50"
                        />
                        {voted ? (
                          <Button
                            onClick={() => updateLabelsMutation.mutate(candidate.id)}
                            className="w-full border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                            size="sm"
                            disabled={updateLabelsMutation.isPending && updateLabelsMutation.variables === candidate.id}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {updateLabelsMutation.isPending && updateLabelsMutation.variables === candidate.id ? "Atualizando..." : "Atualizar Tags"}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => voteMutation.mutate(candidate.id)}
                            className="w-full border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta hover:bg-neon-magenta/20"
                            size="sm"
                            disabled={voteMutation.isPending && voteMutation.variables === candidate.id}
                          >
                            <Swords className="mr-2 h-4 w-4" />
                            {voteMutation.isPending && voteMutation.variables === candidate.id ? "Votando..." : "Votar"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {candidates.length === 0 && (
              <div className="py-20 text-center">
                <Frown className="mx-auto mb-4 h-16 w-16 text-neon-magenta/50" />
                <p className="text-lg text-muted-foreground">Nenhum candidato ainda...</p>
                <p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro e comece a votação!</p>
              </div>
            )}
          </div>
        )}

        {!activeRankingId && (
          <div className="py-20 text-center">
            <ListPlus className="mx-auto mb-4 h-16 w-16 text-neon-cyan/50" />
            <p className="text-lg text-muted-foreground">Nenhum ranking ainda.</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro ranking para começar!</p>
            {session && (
              <Button
                onClick={() => setShowCreateRanking(true)}
                className="mt-4 border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
              >
                <ListPlus className="mr-2 h-4 w-4" /> Criar Ranking
              </Button>
            )}
          </div>
        )}
        {activeRankingId && (
          <div className="container mx-auto px-4 pb-12">
            <Separator className="mb-8 border-neon-cyan/10" />

            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowActivity(!showActivity)}
                className="flex items-center gap-2 text-sm text-neon-cyan hover:text-neon-magenta transition-colors"
              >
                <Activity className="h-4 w-4" />
                {showActivity ? "Ocultar atividade" : "Atividade recente"}
              </button>

              <button
                onClick={() => {
                  const url = window.location.origin + "/ranking?rankingId=" + activeRankingId
                  navigator.clipboard.writeText(url)
                  toast.success("Link copiado!", { style: { border: "1px solid #00f0ff", color: "#00f0ff" } })
                }}
                className="flex items-center gap-2 text-sm text-neon-magenta hover:text-neon-cyan transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar ranking
              </button>
            </div>

            {showActivity && (
              <div className="mt-4 space-y-2">
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma atividade ainda...</p>
                )}
                {recentActivity.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 rounded-lg border border-neon-cyan/10 bg-card/40 px-4 py-2 text-sm backdrop-blur-sm"
                  >
                    <Avatar className="h-6 w-6 ring-1 ring-neon-cyan/30">
                      {v.voter.image ? <AvatarImage src={v.voter.image} /> : null}
                      <AvatarFallback className="bg-neon-magenta/20 text-[8px] text-neon-magenta">
                        {v.voter.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{v.voter.name}</span>{" "}
                      votou em{" "}
                      <span className="font-medium text-neon-cyan">{v.candidate.name}</span>
                    </span>
                    {v.voteLabels.length > 0 && (
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        [{v.voteLabels.map((vl) => vl.label.name).join(", ")}]
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {timeAgo(new Date(v.createdAt))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {reactionMeme && (
          <MemeReaction
            memeUrl={reactionMeme}
            onDone={() => setReactionMeme(null)}
          />
        )}
        {emojis.show && <FloatingEmojis />}
      </div>
    </>
  )
}
