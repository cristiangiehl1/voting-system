"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateListDialog } from "@/components/CreateListDialog"
import {
  Plus,
  Users,
  Sparkles,
  Vote,
  ClipboardCheck,
  Share2,
  BarChart3,
  Trophy,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
  ImageIcon,
} from "lucide-react"
import { AnimatedHero } from "@/components/AnimatedHero"
import { PageTransition } from "@/components/PageTransition"
import { queryKeys } from "@/lib/query-keys"
import { getPublicLists } from "@/app/actions/lists"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useReducedMotion } from "@/hooks/useReducedMotion"

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Crie sua lista",
    description: "Defina um tema, adicione uma descrição e configure as regras de votação — data de expiração, votos múltiplos ou ranking.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Share2,
    title: "Convide participantes",
    description: "Compartilhe o link ou adicione participantes por email. Cada um pode acessar e votar de qualquer dispositivo.",
    gradient: "from-accent/20 to-accent/5",
  },
  {
    icon: BarChart3,
    title: "Acompanhe resultados",
    description: "Os votos são computados em tempo real. Visualize rankings, gráficos e distribuição de votos com animações.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
]

const FEATURES = [
  {
    icon: Vote,
    title: "Votação com um clique",
    description: "Interface intuitiva onde cada participante vota com um clique. Suporte a votos múltiplos e ranking.",
  },
  {
    icon: Trophy,
    title: "Ranking personalizado",
    description: "Modele sua votação com pontuação por posição. Defina quantos itens cada participante pode rankear.",
  },
  {
    icon: Users,
    title: "Convite por email",
    description: "Adicione participantes diretamente pelo email deles. Cada um recebe acesso às listas que participa.",
  },
  {
    icon: BarChart3,
    title: "Resultados ao vivo",
    description: "Acompanhe a apuração em tempo real com gráficos animados e contadores progressivos.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade dos votos",
    description: "Configure se os votos são revelados ou anônimos. Ideal para enquetes justas e sem influência.",
  },
  {
    icon: Zap,
    title: "Rápido e responsivo",
    description: "Experiência fluida em qualquer dispositivo. Animações suaves e feedback visual imediato.",
  },
]

export function HomeContent({
  session,
}: {
  session: { user: { id: string; name: string | null; email: string | null } } | null
}) {
  const [open, setOpen] = useState(false)
  const stepsRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const { data: publicLists = [] } = useQuery({
    queryKey: queryKeys.publicLists,
    queryFn: () => getPublicLists(),
  })

  useLayoutEffect(() => {
    if (reduce) return

    const ctx = gsap.context(() => {
      const sections = [
        { ref: stepsRef.current, stagger: 0.12 },
        { ref: featuresRef.current, stagger: 0.08 },
        { ref: ctaRef.current, stagger: 0 },
      ]

      sections.forEach(({ ref, stagger }) => {
        if (!ref) return
        const children = ref.children
        if (!children || children.length === 0) return

        gsap.fromTo(
          children,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ref,
              start: "top 85%",
              once: true,
            },
          }
        )
      })
    }, [stepsRef, featuresRef, ctaRef])

    return () => ctx.revert()
  }, [reduce])

  return (
    <PageTransition>
      <AnimatedHero />

      {publicLists.length > 0 && (
        <section className="relative overflow-hidden border-b border-border/20">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
                <Globe className="mr-1.5 h-3 w-3" />
                Listas públicas
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Votações abertas
              </h2>
              <p className="mt-3 text-muted-foreground">
                Participe de votações públicas sem precisar de convite.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {publicLists.slice(0, 6).map((list) => (
                <Link key={list.id} href={session ? `/lists/${list.id}` : "/login"} className="group block">
                  <div className="glass-premium rounded-xl overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                    <div className="image-zoom">
                      {list.imageUrl ? (
                        <img src={list.imageUrl} alt={list.name} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 font-semibold truncate">{list.name}</h3>
                      <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                        {list.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {list._count.options} opções
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {list._count.participants} participantes
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {publicLists.length > 6 && (
              <div className="mt-8 text-center">
                <Link href={session ? "/lists" : "/login"}>
                  <Button variant="outline" className="gap-2">
                    Ver todas as listas públicas
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section className="relative overflow-hidden border-b border-border/20">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
              Como funciona
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Três passos para sua votação
            </h2>
            <p className="mt-3 text-muted-foreground">
              Da criação ao resultado, o Eleito simplifica todo o processo de votação.
            </p>
          </div>

          <div
            ref={stepsRef}
            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3"
          >
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="glass-premium relative rounded-xl p-6 transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${step.gradient} p-3 ring-1 ring-primary/10`}
                >
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative overflow-hidden border-b border-border/20">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-accent/20 bg-accent/5 text-accent">
              Recursos
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Tudo que você precisa
            </h2>
            <p className="mt-3 text-muted-foreground">
              Funcionalidades pensadas para tornar suas votações justas, transparentes e divertidas.
            </p>
          </div>

          <div
            ref={featuresRef}
            className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass-premium rounded-xl p-5 transition-all duration-500 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-b border-border/20">
        <div
          ref={ctaRef}
          className="container mx-auto px-4 py-20 md:py-28"
        >
          <div className="glass-premium relative mx-auto max-w-3xl overflow-hidden rounded-2xl p-8 text-center md:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background: "radial-gradient(circle at 30% 50%, oklch(0.7 0.2 260 / 0.3), transparent 60%), radial-gradient(circle at 70% 50%, oklch(0.75 0.2 320 / 0.2), transparent 60%)",
              }}
            />

            <div className="relative">
              <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
                <Sparkles className="mr-1 h-3 w-3" />
                Comece agora
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Pronto para criar sua votação?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Junte-se a dezenas de usuários que já utilizam o Eleito para criar votações
                elegantes e acompanhar resultados em tempo real.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {session ? (
                  <Button
                    size="lg"
                    className="gap-2 px-8"
                    onClick={() => setOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Criar nova lista
                  </Button>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="gap-2 px-8">
                        <Sparkles className="h-4 w-4" />
                        Criar conta gratuita
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="px-8">
                        Já tenho conta
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CreateListDialog open={open} onOpenChange={setOpen} />
    </PageTransition>
  )
}
