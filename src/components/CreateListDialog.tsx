"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { createListSchema, type CreateListData } from "@/lib/schemas"

type Props = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateListDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [listImageUploading, setListImageUploading] = useState(false)

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
      return api.createList({
        name: data.name,
        description: data.description || undefined,
        expiresAt: data.expiresAt || undefined,
        revealVotes: data.revealVotes,
        allowMultipleVotes: data.allowMultipleVotes,
        rankedVoting: data.rankedVoting,
        maxRank: data.maxRank,
        allowParticipantsToAddOptions: data.allowParticipantsToAddOptions,
        isPublic: data.isPublic,
      })
    },
    onSuccess: (listId) => {
      form.reset()
      onOpenChange?.(false)
      toast.success("Lista criada com sucesso")
      router.push(`/lists/${listId}`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar nova lista
          </DialogTitle>
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
            <Label htmlFor="dialog-list-name">Nome</Label>
            <Input
              id="dialog-list-name"
              placeholder="Ex: Melhor filme do ano"
              className="bg-card"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-list-description">Descrição (opcional)</Label>
            <Textarea
              id="dialog-list-description"
              placeholder="Descreva o propósito da votação"
              className="bg-card"
              {...form.register("description")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-list-expires">Expira em (opcional)</Label>
            <Input id="dialog-list-expires" type="datetime-local" className="bg-card" {...form.register("expiresAt")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-list-image">Imagem de capa (opcional)</Label>
            <Input
              id="dialog-list-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                form.setValue("image", file ?? undefined)
              }}
              disabled={listImageUploading}
              className="bg-card"
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
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
            <input
              id="dialog-list-reveal"
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
              {...form.register("revealVotes")}
            />
            <div className="grid gap-1">
              <Label htmlFor="dialog-list-reveal" className="cursor-pointer font-medium">
                Divulgar votos
              </Label>
              <p className="text-xs text-muted-foreground">
                Mostra, em cada opção, quais participantes votaram nela.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
            <input
              id="dialog-list-multiple-votes"
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
              {...form.register("allowMultipleVotes")}
              disabled={rankedVoting}
            />
            <div className="grid gap-1">
              <Label htmlFor="dialog-list-multiple-votes" className={`cursor-pointer font-medium ${rankedVoting ? "text-muted-foreground" : ""}`}>
                Permitir votos múltiplos
              </Label>
              <p className="text-xs text-muted-foreground">
                {rankedVoting
                  ? "Sempre ativo para votações por ranking."
                  : "Quando ativo, cada participante pode votar em várias opções. Se desativado, apenas uma opção por participante."}
              </p>
            </div>
          </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
              <input
                id="dialog-list-ranked"
                type="checkbox"
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                {...form.register("rankedVoting")}
              />
              <div className="grid gap-1">
                <Label htmlFor="dialog-list-ranked" className="cursor-pointer font-medium">
                  Votação por ranking
                </Label>
                <p className="text-xs text-muted-foreground">
                  Participantes rankeiam suas opções favoritas em vez de apenas votar.
                </p>
              </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
            <input
              id="dialog-list-public"
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
              {...form.register("isPublic")}
            />
            <div className="grid gap-1">
              <Label htmlFor="dialog-list-public" className="cursor-pointer font-medium">
                Lista pública
              </Label>
              <p className="text-xs text-muted-foreground">
                Qualquer usuário pode ver e votar sem precisar de convite.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
              <input
                id="dialog-list-allow-add"
                type="checkbox"
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-card text-primary accent-primary"
                {...form.register("allowParticipantsToAddOptions")}
              />
              <div className="grid gap-1">
                <Label htmlFor="dialog-list-allow-add" className="cursor-pointer font-medium">
                  Participantes podem adicionar opções
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando ativo, qualquer participante pode adicionar ou remover itens da lista. Se desativado, apenas o criador pode gerenciar as opções.
                </p>
              </div>
            </div>
          {rankedVoting && (
            <div className="space-y-2">
              <Label htmlFor="dialog-list-max-rank">Máximo de rankings por participante</Label>
              <Input
                id="dialog-list-max-rank"
                type="number"
                min={1}
                max={10}
                className="bg-card"
                {...form.register("maxRank", { valueAsNumber: true })}
              />
            </div>
          )}
          <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Criando...
              </span>
            ) : (
              "Criar lista"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
