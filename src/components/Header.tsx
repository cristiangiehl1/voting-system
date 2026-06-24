"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Scale, LogOut, User, UserCircle, ListChecks, Menu, X, Mail } from "lucide-react"
import { queryKeys } from "@/lib/query-keys"
import { countMyPendingInvites } from "@/app/actions/lists"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: pendingInvitesCount = 0 } = useQuery({
    queryKey: [...queryKeys.myInvites, "count"],
    queryFn: () => countMyPendingInvites(),
    enabled: !!session?.user?.id,
    refetchInterval: 30_000,
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

        {session?.user && (
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Início
            </Link>
            <Link
              href="/lists"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" />
                Minhas listas
              </span>
            </Link>
            <Link
              href="/invites"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                Convites
                {pendingInvitesCount > 0 && (
                  <Badge className="h-5 px-1.5 text-[10px] leading-none">{pendingInvitesCount}</Badge>
                )}
              </span>
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

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
                    onClick={() => {
                      setMobileOpen(false)
                      router.push("/lists")
                    }}
                    className="gap-2.5 md:hidden"
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
                    onClick={() => router.push("/profile")}
                    className="gap-2.5"
                  >
                    <UserCircle className="h-4 w-4 shrink-0" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
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

      {session?.user && mobileOpen && (
        <div className="border-t border-border/30 bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Início
            </Link>
            <Link
              href="/lists"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Minhas listas
              </span>
            </Link>
            <Link
              href="/invites"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Convites
                {pendingInvitesCount > 0 && (
                  <Badge className="h-5 px-1.5 text-[10px] leading-none">{pendingInvitesCount}</Badge>
                )}
              </span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
