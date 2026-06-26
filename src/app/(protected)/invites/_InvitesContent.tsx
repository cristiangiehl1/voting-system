"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Mail, Check, X, Vote, CalendarDays, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

type InviteData = {
  id: string
  email: string
  status: string
  createdAt: Date
  list: {
    id: string
    name: string
    createdBy: { name: string | null }
  }
}

export default function InvitesPageContent() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: invites = [], isPending } = useQuery({
    queryKey: queryKeys.myInvites,
    queryFn: () => api.getMyInvites(),
    enabled: !!session?.user?.id,
  })

  const acceptMutation = useMutation({
    mutationFn: (inviteId: string) => api.acceptInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myInvites })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      toast.success("Convite aceito!")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao aceitar convite"),
  })

  const rejectMutation = useMutation({
    mutationFn: (inviteId: string) => api.rejectInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myInvites })
      toast.success("Convite recusado")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao recusar convite"),
  })

  if (!session) {
    return (
      <PageTransition>
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
          <div className="text-center">
            <Vote className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Faça login para ver seus convites</h2>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Meus convites</h1>
          {invites.length > 0 && (
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              {invites.length} pendente{invites.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {isPending ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
                <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
                <div className="mb-4 h-4 w-1/3 rounded bg-muted" />
                <div className="mb-6 h-4 w-1/2 rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-9 flex-1 rounded bg-muted" />
                  <div className="h-9 flex-1 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Nenhum convite pendente</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você não possui convites no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invites.map((invite: InviteData) => (
              <div key={invite.id}>
                <AnimatedCard className="group h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 text-base">
                        {invite.list.name}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        Pendente
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <User className="h-3 w-3" />
                      {invite.list.createdBy.name || "Anônimo"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      Convidado em {formatDate(invite.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 flex-1"
                        onClick={() => acceptMutation.mutate(invite.id)}
                        disabled={acceptMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 flex-1"
                        onClick={() => rejectMutation.mutate(invite.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                        Recusar
                      </Button>
                    </div>
                    <Link
                      href={`/lists/${invite.list.id}`}
                      className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Ver lista
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </AnimatedCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
