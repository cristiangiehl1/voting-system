"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { createOptionSchema, type CreateOptionData } from "@/lib/schemas"
import { useCreateOption } from "@/hooks/mutations/useCreateOption"

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

type Props = {
  listId: string
}

export function OptionDialog({ listId }: Props) {
  const [open, setOpen] = useState(false)
  const [optionImageUploading, setOptionImageUploading] = useState(false)

  const form = useForm<CreateOptionData>({
    resolver: zodResolver(createOptionSchema),
    defaultValues: { listId, name: "", description: "", referenceUrl: "" },
  })

  const optionImage = form.watch("image")

  const addOptionMutation = useCreateOption(listId,
    () => {
      form.reset({ listId, name: "", description: "", referenceUrl: "" })
      setOpen(false)
      toast.success("Opção adicionada")
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao adicionar opção"),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          onSubmit={form.handleSubmit(async (data) => {
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
          <input type="hidden" {...form.register("listId")} />
          <div className="space-y-2">
            <Label htmlFor="optionName">Nome</Label>
            <Input
              id="optionName"
              placeholder="Ex: O Poderoso Chefão"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="optionDescription">Descrição (opcional)</Label>
            <Textarea
              id="optionDescription"
              placeholder="Informações adicionais sobre a opção"
              {...form.register("description")}
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
                  form.setValue("image", file ?? undefined)
                }}
                disabled={optionImageUploading}
              />
            </div>
            {optionImage && (
              <div className="mt-2 overflow-hidden rounded-lg border border-border/50">
                <img
                  src={URL.createObjectURL(optionImage as File)}
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
              {...form.register("referenceUrl")}
            />
            {(form.watch("referenceUrl") ?? "") && (
              <p className="text-xs text-muted-foreground">
                {getReferenceLabel(form.watch("referenceUrl") ?? "")}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={addOptionMutation.isPending || optionImageUploading}>
            {optionImageUploading ? "Enviando imagem..." : addOptionMutation.isPending ? "Adicionando..." : "Adicionar opção"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
