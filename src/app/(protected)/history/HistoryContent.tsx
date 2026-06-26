"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedCard } from "@/components/AnimatedCard"
import { PageTransition } from "@/components/PageTransition"
import { ArrowLeft, Vote, Trophy, ListOrdered, ExternalLink, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"
import { api } from "@/lib/api-client"
import { formatDistanceToNow } from "@/lib/utils"

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function HistoryContent() {
  const router = useRouter()
  const { data: session } = useSession()

  const { data: history = [], isPending } = useQuery({
    queryKey: queryKeys.votingHistory,
    queryFn: () => api.getMyVotingHistory(),
    enabled: !!session?.user?.id,
  })

  if (!session) {
    return (
      <PageTransition>
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
          <div className="text-center">
            <Vote className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Faça login para ver seu histórico</h2>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Meu histórico de votos</h1>
        </div>

        {isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
                <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
                <div className="mb-2 h-4 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Vote className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-bold">Nenhum voto registrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você ainda não votou em nenhuma lista.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <AnimatedCard
                key={entry.list.id}
                className="overflow-hidden"
                style={{ animationDelay: "0s" }}
              >
                <div className="flex flex-col sm:flex-row">
                  {entry.list.imageUrl && (
                    <div className="h-32 w-full shrink-0 sm:h-auto sm:w-48">
                      <img
                        src={entry.list.imageUrl}
                        alt={entry.list.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Link
                          href={`/lists/${entry.list.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {entry.list.name}
                        </Link>
                        {entry.list.rankedVoting && (
                          <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                            <ListOrdered className="h-3 w-3" />
                            Ranking
                          </Badge>
                        )}
                      </div>
                      <p className="mb-3 text-xs text-muted-foreground">
                        por {entry.list.createdBy.name || "Anônimo"} &middot; Criada em {formatDate(entry.list.createdAt)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.votes.map((vote: any, i: any) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className={`text-xs ${vote.rank != null ? "border-primary/30 bg-primary/10" : ""}`}
                          >
                            {vote.rank != null ? `${vote.rank}º ` : ""}{vote.optionName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        Votou {formatDistanceToNow(new Date(entry.votes[0]?.votedAt ?? entry.list.createdAt))}
                      </span>
                      <Link
                        href={`/lists/${entry.list.id}`}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver lista
                      </Link>
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
