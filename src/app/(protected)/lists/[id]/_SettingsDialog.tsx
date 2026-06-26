"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Settings, Eye, EyeOff, Trash2 } from "lucide-react"
import { updateListSchema, type UpdateListData } from "@/lib/schemas"
import { useUpdateList } from "@/hooks/mutations/useUpdateList"
import { useDeleteList } from "@/hooks/mutations/useDeleteList"

type Props = {
  listId: string
  list: {
    name: string
    description: string | null
    imageId: string | null
    imageUrl: string | null
    revealVotes: boolean
    allowMultipleVotes: boolean
    rankedVoting: boolean
    maxRank: number
    allowParticipantsToAddOptions: boolean
    isPublic: boolean
  }
}

export function SettingsDialog({ listId, list }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [listImageUploading, setListImageUploading] = useState(false)

  const deleteListMutation = useDeleteList(
    () => {
      setOpen(false)
      toast.success("Lista deletada")
      window.location.href = "/"
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao deletar lista"),
  )

  const updateListMutation = useUpdateList(listId,
    () => {
      setOpen(false)
      toast.success("Configuração atualizada")
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar configuração"),
  )

  const form = useForm<UpdateListData>({
    resolver: zodResolver(updateListSchema),
    defaultValues: {
      name: list.name ?? "",
      description: list.description ?? "",
      revealVotes: list.revealVotes ?? false,
      allowMultipleVotes: list.allowMultipleVotes ?? false,
      rankedVoting: list.rankedVoting ?? false,
      maxRank: list.maxRank ?? 5,
      allowParticipantsToAddOptions: list.allowParticipantsToAddOptions ?? false,
      isPublic: list.isPublic ?? false,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: list.name ?? "",
        description: list.description ?? "",
        revealVotes: list.revealVotes ?? false,
        allowMultipleVotes: list.allowMultipleVotes ?? false,
        rankedVoting: list.rankedVoting ?? false,
        maxRank: list.maxRank ?? 5,
        allowParticipantsToAddOptions: list.allowParticipantsToAddOptions ?? false,
        isPublic: list.isPublic ?? false,
      })
      setConfirmDelete(false)
    }
  }, [open])

  const watchRankedVotingSettings = form.watch("rankedVoting")
  const watchMultipleSettings = form.watch("allowMultipleVotes")
  useEffect(() => {
    if (watchRankedVotingSettings && !watchMultipleSettings) {
      form.setValue("allowMultipleVotes", true)
    }
  }, [watchRankedVotingSettings, watchMultipleSettings, form])

  const listImage = form.watch("image")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Input id="listName" {...form.register("name")} disabled={updateListMutation.isPending} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="listDescription">Descrição (opcional)</Label>
            <Textarea id="listDescription" {...form.register("description")} disabled={updateListMutation.isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listImage">Imagem de capa (opcional)</Label>
            <Input
              id="listImage"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                form.setValue("image", file ?? undefined)
              }}
              disabled={updateListMutation.isPending || listImageUploading}
            />
            {listImage && (
              <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                <img
                  src={URL.createObjectURL(listImage as File)}
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
              {...form.register("isPublic")}
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
              {...form.register("revealVotes")}
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
              {...form.register("allowMultipleVotes")}
              disabled={updateListMutation.isPending || form.watch("rankedVoting")}
            />
            <div className="grid gap-1">
              <Label htmlFor="allowMultipleVotes" className={`cursor-pointer font-medium ${form.watch("rankedVoting") ? "text-muted-foreground" : ""}`}>
                Permitir votos múltiplos
              </Label>
              <p className="text-xs text-muted-foreground">
                {form.watch("rankedVoting")
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
              {...form.register("allowParticipantsToAddOptions")}
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
          {form.watch("rankedVoting") && (
            <div className="space-y-2">
              <Label htmlFor="maxRank">Máximo de rankings por participante</Label>
              <Input
                id="maxRank"
                type="number"
                min={1}
                max={10}
                {...form.register("maxRank", { valueAsNumber: true })}
                disabled={updateListMutation.isPending}
              />
            </div>
          )}
          <Separator />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {form.watch("revealVotes") ? (
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
  )
}
