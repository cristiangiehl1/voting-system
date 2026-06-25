"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import {
  Users,
  ListChecks,
  CalendarDays,
  Clock,
  ArrowRight,
  ListOrdered,
  ImageIcon,
  Vote,
  Plus,
  Globe,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnimatedCard } from "@/components/AnimatedCard"
import { CreateListDialog } from "@/components/CreateListDialog"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"
import { getMyLists, getPublicLists, getMyListsPaginated } from "@/app/actions/lists"

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

export default function ListsPageContent() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("my-lists")

  const { data: listsData, isPending: listsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.lists,
    queryFn: ({ pageParam }) => getMyListsPaginated(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!session?.user?.id,
  })
  const lists = listsData?.pages.flatMap(p => p.items) ?? []

  const { data: publicLists = [], isPending: publicListsLoading } = useQuery({
    queryKey: queryKeys.publicLists,
    queryFn: () => getPublicLists(),
  })

  const ownedLists = lists.filter((l) => l.createdById === session?.user?.id)
  const participantLists = lists.filter((l) => l.createdById !== session?.user?.id)

  if (!session) {
    return (
      <PageTransition>
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
          <div className="text-center">
            <Vote className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Faça login para ver suas listas</h2>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (listsLoading && publicListsLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-10">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
                <div className="h-48 rounded-t-xl bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    )
  }

  if (lists.length === 0 && publicLists.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Nenhuma lista ainda</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie sua primeira lista para começar.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Criar nova lista
            </Button>
          </div>
          <CreateListDialog open={open} onOpenChange={setOpen} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Listas</h1>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Criar lista
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="my-lists">
              Minhas listas
              {lists.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({lists.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="explore">
              <Globe className="mr-1.5 h-3.5 w-3.5" />
              Explorar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-lists">
            {ownedLists.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
                  Criadas por mim ({ownedLists.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ownedLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </div>
              </section>
            )}

            {participantLists.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
                  Participando ({participantLists.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {participantLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </div>
              </section>
            )}

            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Carregando..." : "Carregar mais listas"}
                </Button>
              </div>
            )}

            {lists.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-bold">Nenhuma lista ainda</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Crie sua primeira lista para começar.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="explore">
            {publicLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Globe className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-bold">Nenhuma lista pública</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ainda não há listas públicas disponíveis.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicLists.map((list) => (
                  <ListCard key={list.id} list={list} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <CreateListDialog open={open} onOpenChange={setOpen} />
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
    <Link href={`/lists/${list.id}`} className="block list-card">
      <AnimatedCard className="group h-full cursor-pointer overflow-hidden pt-0 card-hover">
        <div className="image-zoom overflow-hidden rounded-t-xl">
          {list.imageUrl ? (
            <img src={list.imageUrl} alt={list.name} className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-base">{list.name}</CardTitle>
            {expired ? (
              <Badge variant="secondary" className="shrink-0 text-xs">Encerrada</Badge>
            ) : list.expiresAt ? (
              <Badge variant="outline" className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                Ativa
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 text-xs">Indeterminada</Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2 text-xs">
            {list.description || "Sem descrição"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {list._count.participants}
            </span>
            <span className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {list._count.options}
            </span>
            {list.rankedVoting && (
              <span className="flex items-center gap-1">
                <ListOrdered className="h-3.5 w-3.5" />
                Top {list.maxRank}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border/20 pt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {list.expiresAt ? (
                expired ? (
                  <span>Encerrou</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(list.expiresAt)}
                  </span>
                )
              ) : (
                <span>Sem data</span>
              )}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </CardContent>
      </AnimatedCard>
    </Link>
  )
}
