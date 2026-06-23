"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ListChecks, LogOut, User, UserCircle } from "lucide-react"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30 transition-all group-hover:bg-primary/20">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Voting Lists</span>
        </Link>

        <nav className="flex items-center gap-4">
          {session?.user ? (
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
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="gap-2"
                >
                  <UserCircle className="h-4 w-4 shrink-0" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs text-muted-foreground" disabled>
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[140px]" title={session.user.email ?? ""}>{session.user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
