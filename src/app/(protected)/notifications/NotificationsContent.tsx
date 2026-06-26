"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { ArrowLeft, Bell, CheckCheck, ExternalLink, Vote, Frown } from "lucide-react"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"
import { api } from "@/lib/api-client"
import { formatDistanceToNow } from "@/lib/utils"

const NOTIFICATION_ICONS: Record<string, string> = {
  INVITE_RECEIVED: "📨",
  INVITE_ACCEPTED: "✅",
  INVITE_REJECTED: "❌",
  NEW_VOTE: "🗳️",
  OPTION_ADDED: "➕",
  OPTION_REMOVED: "➖",
  LIST_DELETED: "🗑️",
}

export function NotificationsContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const { data: notifications = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.getMyNotifications(),
    enabled: !!session?.user?.id,
    refetchInterval: 15_000,
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.notificationCount,
    queryFn: () => api.countUnreadNotifications(),
    enabled: !!session?.user?.id,
    refetchInterval: 15_000,
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.markNotificationAsRead(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationCount })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao marcar como lida"),
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.markAllNotificationsAsRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationCount })
      toast.success("Todas as notificações marcadas como lidas")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao marcar como lidas"),
  })

  if (!session) {
    return (
      <PageTransition>
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
          <div className="text-center">
            <Vote className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Faça login para ver notificações</h2>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
            {unreadCount > 0 && (
              <Badge>{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              {markAllReadMutation.isPending ? "Marcando..." : "Marcar todas como lidas"}
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-bold">Nenhuma notificação</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você será notificado quando receber convites, votos e outras atividades.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <AnimatedCard
                key={notif.id}
                className={`cursor-pointer transition-colors ${!notif.readAt ? "border-primary/30 bg-primary/[0.03]" : ""}`}
                style={{ animationDelay: "0s" }}
                onClick={() => {
                  if (!notif.readAt) {
                    markReadMutation.mutate(notif.id)
                  }
                  if (notif.listId) {
                    router.push(`/lists/${notif.listId}`)
                  }
                }}
              >
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 shrink-0 text-xl leading-none">
                    {NOTIFICATION_ICONS[notif.type] ?? "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.readAt ? "font-medium" : ""}`}>
                        {notif.title}
                      </p>
                      {!notif.readAt && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.createdAt))}
                      </p>
                      {notif.listId && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Ver lista
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
