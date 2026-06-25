"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Scale, LogOut, UserCircle, ListChecks, Mail, Bell, History } from "lucide-react"
import { queryKeys } from "@/lib/query-keys"
import { countMyPendingInvites, getMyNotifications, markNotificationAsRead, countUnreadNotifications } from "@/app/actions/lists"
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

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: pendingInvitesCount = 0 } = useQuery({
    queryKey: [...queryKeys.myInvites, "count"],
    queryFn: () => countMyPendingInvites(),
    enabled: !!session?.user?.id,
    refetchInterval: 30_000,
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.notificationCount,
    queryFn: () => countUnreadNotifications(),
    enabled: !!session?.user?.id,
    refetchInterval: 15_000,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => getMyNotifications(),
    enabled: !!session?.user?.id,
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await markNotificationAsRead(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationCount })
    },
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary ring-1 ring-primary/30 transition-all group-hover:ring-primary/60">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-gradient-premium">Eleito</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <span className="relative inline-flex">
                    <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-1.5">
                  <div className="mb-1.5 flex items-center justify-between border-b border-border/30 px-2.5 pb-2">
                    <p className="text-sm font-medium">Notificações</p>
                    {notifications.length > 0 && (
                      <Link
                        href="/notifications"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver todas
                      </Link>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
                      Nenhuma notificação
                    </p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 5).map((notif) => (
                        <DropdownMenuItem
                          key={notif.id}
                          className="flex items-start gap-2.5 px-2.5 py-2 text-sm cursor-pointer"
                          onClick={() => {
                            if (!notif.readAt) {
                              markReadMutation.mutate(notif.id)
                            }
                            if (notif.listId) {
                              router.push(`/lists/${notif.listId}`)
                            }
                          }}
                        >
                          <span className="mt-0.5 shrink-0 text-base leading-none">
                            {NOTIFICATION_ICONS[notif.type] ?? "🔔"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate ${!notif.readAt ? "font-medium" : "text-muted-foreground"}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notif.createdAt))}
                            </p>
                          </div>
                          {!notif.readAt && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  {notifications.length > 5 && (
                    <div className="border-t border-border/30 pt-1.5">
                      <Link
                        href="/notifications"
                        className="block rounded-md px-2.5 py-1.5 text-center text-xs text-primary hover:bg-secondary/50"
                      >
                        Ver todas as {notifications.length} notificações
                      </Link>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-border ring-offset-2 ring-offset-background transition-all hover:ring-primary">
                    {session.user.image ? (
                      <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
                    ) : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[220px] p-1.5">
                  <div className="mb-1.5 border-b border-border/30 px-2.5 pb-2">
                    <p className="truncate text-sm font-medium">{session.user.name || "Usuário"}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => router.push("/lists")}
                    className="gap-2.5"
                  >
                    <ListChecks className="h-4 w-4 shrink-0" />
                    Minhas listas
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/invites")}
                    className="gap-2.5"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    Convites
                    {pendingInvitesCount > 0 && (
                      <Badge className="ml-auto h-5 px-1.5 text-[10px] leading-none">{pendingInvitesCount}</Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/notifications")}
                    className="gap-2.5"
                  >
                    <Bell className="h-4 w-4 shrink-0" />
                    Notificações
                    {unreadCount > 0 && (
                      <Badge className="ml-auto h-5 px-1.5 text-[10px] leading-none">{unreadCount}</Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/history")}
                    className="gap-2.5"
                  >
                    <History className="h-4 w-4 shrink-0" />
                    Histórico
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="gap-2.5"
                  >
                    <UserCircle className="h-4 w-4 shrink-0" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login` })}
                    className="gap-2.5 text-muted-foreground focus:text-foreground"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
