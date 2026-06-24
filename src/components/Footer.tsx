"use client"

import Link from "next/link"
import { Scale, Code2, Mail, ArrowUp } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative border-t border-border/20 bg-background/50 backdrop-blur-3xl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Scale className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight">
                <span className="text-gradient-premium">Eleito</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma moderna de votação. Crie listas, convide participantes e acompanhe
              resultados em tempo real com uma experiência visual imersiva.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Plataforma
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Início
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Criar conta
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recursos
            </h4>
            <nav className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Votação simples</span>
              <span className="text-sm text-muted-foreground">Ranking personalizado</span>
              <span className="text-sm text-muted-foreground">Convite por email</span>
              <span className="text-sm text-muted-foreground">Resultados em tempo real</span>
            </nav>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Contato
            </h4>
            <nav className="flex flex-col gap-2">
              <a
                href="mailto:cristiangiehl@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" />
                cristiangiehl@gmail.com
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/20 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Eleito. Todos os direitos reservados.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar ao topo
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  )
}
