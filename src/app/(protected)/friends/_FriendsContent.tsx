"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { UserPlus, UserCheck, UserX, Clock, X, Check, User, Users, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { toast } from "sonner"
import { useFriends } from "@/hooks/queries/useFriends"
import { useSendFriendRequest } from "@/hooks/mutations/useSendFriendRequest"
import { useAcceptFriendRequest } from "@/hooks/mutations/useAcceptFriendRequest"
import { useRejectFriendRequest } from "@/hooks/mutations/useRejectFriendRequest"
import { useRemoveFriend } from "@/hooks/mutations/useRemoveFriend"

type FriendUser = {
  id: string
  name: string | null
  email: string | null
  imageUrl: string | null
}

type Friendship = {
  id: string
  requesterId: string
  addresseeId: string
  status: string
  createdAt: string
  requester: FriendUser
  addressee: FriendUser
}

type FriendsData = {
  sent: Friendship[]
  received: Friendship[]
}

function FriendAvatar({ user }: { user: FriendUser }) {
  const initials = (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground ring-1 ring-border">
      {initials}
    </div>
  )
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function FriendsContent() {
  const { data: session } = useSession()
  const [email, setEmail] = useState("")

  const { data: friendships, isPending } = useFriends(!!session?.user?.id)

  const sendMutation = useSendFriendRequest(
    () => {
      toast.success("Pedido de amizade enviado!")
      setEmail("")
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao enviar pedido"),
  )

  const acceptMutation = useAcceptFriendRequest(
    () => toast.success("Pedido de amizade aceito!"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao aceitar pedido"),
  )

  const rejectMutation = useRejectFriendRequest(
    () => toast.success("Pedido de amizade recusado"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao recusar pedido"),
  )

  const removeMutation = useRemoveFriend(
    () => toast.success("Amizade removida"),
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao remover amizade"),
  )

  const sentPending = (friendships as FriendsData | undefined)?.sent.filter((f) => f.status === "PENDING") ?? []
  const receivedPending = (friendships as FriendsData | undefined)?.received.filter((f) => f.status === "PENDING") ?? []
  const acceptedSent = (friendships as FriendsData | undefined)?.sent.filter((f) => f.status === "ACCEPTED") ?? []
  const acceptedReceived = (friendships as FriendsData | undefined)?.received.filter((f) => f.status === "ACCEPTED") ?? []

  const friends = [
    ...acceptedSent.map((f) => ({ friendshipId: f.id, user: f.addressee, createdAt: f.createdAt })),
    ...acceptedReceived.map((f) => ({ friendshipId: f.id, user: f.requester, createdAt: f.createdAt })),
  ]

  if (!session) {
    return (
      <PageTransition>
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
          <div className="text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Faça login para ver seus amigos</h2>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Amigos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie suas conexões
            </p>
          </div>
          {friends.length > 0 && (
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              {friends.length} amigo{friends.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="mb-8 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Email do usuário..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && email.trim()) {
                  sendMutation.mutate(email.trim())
                }
              }}
            />
            <Button
              onClick={() => {
                if (email.trim()) {
                  sendMutation.mutate(email.trim())
                }
              }}
              disabled={sendMutation.isPending || !email.trim()}
              className="gap-1.5 shrink-0"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar pedido
            </Button>
          </div>
        </div>

        {isPending ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="received" className="gap-1.5">
                <UserCheck className="h-4 w-4" />
                Recebidos
                {receivedPending.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-[10px] leading-none" variant="destructive">
                    {receivedPending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-1.5">
                <Send className="h-4 w-4" />
                Enviados
                {sentPending.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-[10px] leading-none" variant="secondary">
                    {sentPending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="friends" className="gap-1.5">
                <Users className="h-4 w-4" />
                Amigos
                {friends.length > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-[10px] leading-none" variant="outline">
                    {friends.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received">
              {receivedPending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <UserPlus className="mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum pedido de amizade recebido</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {receivedPending.map((friendship) => (
                    <AnimatedCard key={friendship.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <FriendAvatar user={friendship.requester} />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base">
                              {friendship.requester.name || "Usuário"}
                            </CardTitle>
                            <CardDescription className="truncate text-xs">
                              {friendship.requester.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Recebido em {formatDate(friendship.createdAt)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5 flex-1"
                            onClick={() => acceptMutation.mutate(friendship.id)}
                            disabled={acceptMutation.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 flex-1"
                            onClick={() => rejectMutation.mutate(friendship.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                            Recusar
                          </Button>
                        </div>
                      </CardContent>
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent">
              {sentPending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Send className="mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum pedido de amizade enviado</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sentPending.map((friendship) => (
                    <AnimatedCard key={friendship.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <FriendAvatar user={friendship.addressee} />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base">
                              {friendship.addressee.name || "Usuário"}
                            </CardTitle>
                            <CardDescription className="truncate text-xs">
                              {friendship.addressee.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Enviado em {formatDate(friendship.createdAt)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 w-full"
                          onClick={() => removeMutation.mutate(friendship.id)}
                          disabled={removeMutation.isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancelar pedido
                        </Button>
                      </CardContent>
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="friends">
              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <User className="mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum amigo ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie um pedido de amizade usando o email do usuário
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {friends.map(({ friendshipId, user, createdAt }) => (
                    <AnimatedCard key={friendshipId}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <FriendAvatar user={user} />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base">
                              {user.name || "Usuário"}
                            </CardTitle>
                            <CardDescription className="truncate text-xs">
                              {user.email}
                            </CardDescription>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <UserCheck className="h-4 w-4" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          Amigos desde {formatDate(createdAt)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 w-full text-destructive hover:text-destructive"
                          onClick={() => removeMutation.mutate(friendshipId)}
                          disabled={removeMutation.isPending}
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Remover amigo
                        </Button>
                      </CardContent>
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageTransition>
  )
}
