"use client"

import { useRef, useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { ListChecks, Users, Vote, ArrowLeft, Camera, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { updateUserProfile } from "@/app/actions/lists"
import { queryKeys } from "@/lib/query-keys"
import { updateProfileSchema, type UpdateProfileData } from "@/lib/schemas"

type ProfileStats = {
  createdLists: number
  participatingLists: number
  votes: number
}

export function ProfileContent({
  user,
  stats,
}: {
  user: { id: string; name: string | null; email: string | null; imageUrl: string | null }
  stats: ProfileStats
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { update: updateSession } = useSession()

  const nameForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name ?? "" },
  })

  useEffect(() => {
    nameForm.reset({ name: user.name ?? "" })
  }, [user.name, nameForm])

  const updateNameMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      await updateUserProfile({ name: data.name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      updateSession()
      toast.success("Nome atualizado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar nome"),
  })

  const updateAvatarMutation = useMutation({
    mutationFn: async (data: { imageId: string | null; imageUrl: string | null }) => {
      await updateUserProfile(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      updateSession()
      toast.success("Foto atualizada")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao atualizar foto"),
  })

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "user")
      if (user.imageUrl) {
        formData.append("publicId", user.imageUrl.split("/").pop()?.split(".")[0] ?? "")
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Erro ao fazer upload")

      await updateAvatarMutation.mutateAsync({
        imageId: result.publicId,
        imageUrl: result.secureUrl,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="mb-8 text-center">
          <div className="relative mx-auto h-24 w-24">
            <Avatar className="h-24 w-24 ring-2 ring-border ring-offset-4 ring-offset-background">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt={user.name ?? ""} />
              ) : user.imageUrl ? (
                <AvatarImage src={user.imageUrl} alt={user.name ?? ""} />
              ) : null}
              <AvatarFallback className="bg-secondary text-2xl text-secondary-foreground">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => {
                if (previewUrl) {
                  setPreviewUrl(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                } else {
                  fileInputRef.current?.click()
                }
              }}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <form
            onSubmit={nameForm.handleSubmit((data) => updateNameMutation.mutate(data))}
            className="mx-auto mt-6 flex max-w-xs items-end gap-2"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor="profileName" className="sr-only">Nome</Label>
              <Input
                id="profileName"
                {...nameForm.register("name")}
                disabled={updateNameMutation.isPending}
              />
              {nameForm.formState.errors.name && (
                <p className="text-xs text-destructive text-left">{nameForm.formState.errors.name.message}</p>
              )}
            </div>
            <Button type="submit" size="icon" disabled={updateNameMutation.isPending}>
              {updateNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<ListChecks className="h-5 w-5 text-primary" />}
            label="Listas criadas"
            value={stats.createdLists}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Listas que participo"
            value={stats.participatingLists}
          />
          <StatCard
            icon={<Vote className="h-5 w-5 text-primary" />}
            label="Votos registrados"
            value={stats.votes}
          />
        </div>
      </div>
    </PageTransition>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <AnimatedCard>
      <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
        <div>{icon}</div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      </CardContent>
    </AnimatedCard>
  )
}
