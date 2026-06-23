"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getMyLists, createList } from "@/app/actions/lists"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Users, Clock, ListChecks, CalendarDays, ArrowRight, ListOrdered, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { AnimatedHero } from "@/components/AnimatedHero"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"
import { createListSchema, type CreateListData } from "@/lib/schemas"

function formatDate(date: Date | string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function isExpired(date: Date | string | null) {
  if (!date) return false
  return new Date(date) < new Date()
}

export function HomeContent({
  session,
}: {
  session: { user: { id: string; name: string | null; email: string | null } } | null
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [listImageUploading, setListImageUploading] = useState(false)

  const { data: lists = [] } = useQuery({
    queryKey: queryKeys.lists,
    queryFn: () => getMyLists(),
    enabled: !!session?.user?.id,
  })

  const form = useForm<CreateListData>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      name: "",
      description: "",
      expiresAt: "",
      revealVotes: false,
      allowMultipleVotes: false,
      rankedVoting: false,
      maxRank: 5,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateListData & { imageId?: string; imageUrl?: string }) => {
      return createList(
        data.name,
        data.description || undefined,
        data.expiresAt || undefined,
        data.revealVotes,
        data.allowMultipleVotes,
        data.rankedVoting,
        data.maxRank
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      form.reset()
      setOpen(false)
      toast.success("Lista criada com sucesso")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao criar lista"),
  })

  const rankedVoting = form.watch("rankedVoting")
  const allowMultipleVotes = form.watch("allowMultipleVotes")
  const createImage = form.watch("image")

  useEffect(() => {
    if (rankedVoting && !allowMultipleVotes) {
      form.setValue("allowMultipleVotes", true)
    }
  }, [rankedVoting, allowMultipleVotes, form])

  const ownedLists = lists.filter((l) => l.createdById === session?.user?.id)
  const participantLists = lists.filter((l) => l.createdById !== session?.user?.id)

  return (
    <PageTransition>
      <AnimatedHero />

      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Minhas listas</h2>
            <p className="text-muted-foreground">
              Gerencie suas listas de votação e acompanhe os resultados.
            </p>
          </div>

          {session && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />Nova lista</Button>} />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar nova lista</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit(async (data) => {
                    let imageId: string | undefined
                    let imageUrl: string | undefined

                    const imageFile = data.image
                    if (imageFile) {
                      setListImageUploading(true)
                      try {
                        const fd = new FormData()
                        fd.append("file", imageFile)
                        fd.append("type", "list")

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

                    createMutation.mutate({ ...data, imageId, imageUrl })
                  })}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" placeholder="Ex: Melhor filme do ano" {...form.register("name")} />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o propósito da votação"
                      {...form.register("description")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expira em (opcional)</Label>
                    <Input id="expiresAt" type="datetime-local" {...form.register("expiresAt")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="createListImage">Imagem de capa (opcional)</Label>
                    <Input
                      id="createListImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        form.setValue("image", file ?? undefined)
                      }}
                      disabled={listImageUploading}
                    />
                    {createImage && (
                      <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                        <img
                          src={URL.createObjectURL(createImage)}
                          alt="Preview"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                    <input
                      id="revealVotes"
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                      {...form.register("revealVotes")}
                    />
                    <div className="grid gap-1">
                      <Label htmlFor="revealVotes" className="cursor-pointer font-medium">
                        Divulgar votos
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mostra, em cada opção, quais participantes votaram nela.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                    <input
                      id="allowMultipleVotes"
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                      {...form.register("allowMultipleVotes")}
                      disabled={rankedVoting}
                    />
                    <div className="grid gap-1">
                      <Label htmlFor="allowMultipleVotes" className={`cursor-pointer font-medium ${rankedVoting ? "text-muted-foreground" : ""}`}>
                        Permitir votos múltiplos
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {rankedVoting
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
                      {...form.register("rankedVoting")}
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
                  {rankedVoting && (
                    <div className="space-y-2">
                      <Label htmlFor="maxRank">Máximo de rankings por participante</Label>
                      <Input
                        id="maxRank"
                        type="number"
                        min={1}
                        max={10}
                        {...form.register("maxRank", { valueAsNumber: true })}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar lista"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!session && (
          <AnimatedCard className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Faça login para começar</p>
              <p className="text-sm text-muted-foreground">
                Crie listas de votação e convide outras pessoas para participar.
              </p>
              <Link href="/login" className="mt-4">
                <Button>Entrar</Button>
              </Link>
            </CardContent>
          </AnimatedCard>
        )}

        {session && lists.length === 0 && (
          <AnimatedCard className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Nenhuma lista ainda</p>
              <p className="text-sm text-muted-foreground">
                Crie sua primeira lista de votação clicando no botão acima.
              </p>
            </CardContent>
          </AnimatedCard>
        )}

        {session && ownedLists.length > 0 && (
          <section className="mb-8">
            <h3 className="mb-3 text-lg font-semibold">Criadas por mim</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ownedLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          </section>
        )}

        {session && participantLists.length > 0 && (
          <section>
            <h3 className="mb-3 text-lg font-semibold">Listas que participo</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {participantLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  )
}

type ListData = {
  id: string
  name: string
  description: string | null
  imageId: string | null
  imageUrl: string | null
  createdById: string
  expiresAt: Date | null
  rankedVoting: boolean
  maxRank: number
  _count: { options: number; participants: number }
}

function ListCard({ list }: { list: ListData }) {
  const expired = isExpired(list.expiresAt)

  return (
    <Link href={`/lists/${list.id}`}>
      <AnimatedCard className="group h-full cursor-pointer pt-0">
        <div className="overflow-hidden rounded-t-xl">
          {list.imageUrl ? (
            <img src={list.imageUrl} alt={list.name} className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-muted">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-1 text-lg">{list.name}</CardTitle>
            {expired ? (
              <Badge variant="secondary">Encerrada</Badge>
            ) : list.expiresAt ? (
              <Badge variant="outline">Ativa</Badge>
            ) : (
              <Badge variant="outline">Indeterminada</Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {list.description || "Sem descrição"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {list._count.participants} participante{list._count.participants !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              {list._count.options} opção{list._count.options !== 1 ? "es" : ""}
            </span>
            {list.rankedVoting && (
              <span className="flex items-center gap-1">
                <ListOrdered className="h-4 w-4" />
                Top {list.maxRank}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {list.expiresAt ? (
                expired ? (
                  <span>Encerrou em {formatDate(list.expiresAt)}</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Até {formatDate(list.expiresAt)}
                  </span>
                )
              ) : (
                <span>Sem data de expiração</span>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </CardContent>
      </AnimatedCard>
    </Link>
  )
}
