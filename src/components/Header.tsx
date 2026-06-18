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
import { Skull, Trophy, LogOut, User, UserCircle } from "lucide-react"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neon-cyan/20 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <Skull className="h-6 w-6 text-neon-cyan transition-all duration-300 group-hover:text-neon-magenta group-hover:animate-glitch" />
          <span className="text-lg font-bold tracking-wider uppercase gradient-text">
            Chatômetro
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/ranking">
            <Button
              variant="ghost"
              size="sm"
              className="text-neon-cyan hover:text-neon-magenta hover:bg-neon-cyan/10"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Ranking
            </Button>
          </Link>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-neon-cyan/50 ring-offset-2 ring-offset-background transition-all hover:ring-neon-magenta">
                  {session.user.image ? (
                    <AvatarImage src={session.user.image} alt="meme" />
                  ) : null}
                  <AvatarFallback className="bg-neon-magenta/20 text-neon-magenta">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] border-neon-cyan/20">
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="gap-2 text-neon-cyan"
                >
                  <UserCircle className="h-4 w-4 shrink-0" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-muted-foreground text-xs" disabled>
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[140px]" title={session.user.email ?? ""}>{session.user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="gap-2 text-red-400 focus:text-red-400"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                className="bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 border border-neon-cyan/50"
              >
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
