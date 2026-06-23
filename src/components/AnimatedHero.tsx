"use client"

import { useRef, useLayoutEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ListChecks, Vote, Users } from "lucide-react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function AnimatedHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (!containerRef.current) return

    if (reduce) {
      gsap.set(iconRef.current, { scale: 1, opacity: 1, rotation: 0 })
      gsap.set(titleRef.current?.querySelectorAll(".hero-word") ?? [], { y: 0, opacity: 1 })
      gsap.set(subtitleRef.current, { y: 0, opacity: 1 })
      gsap.set(cardsRef.current?.children ?? [], { y: 0, opacity: 1, scale: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
      })

      tl.to(
        iconRef.current,
        { scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" },
      )
        .to(
          titleRef.current?.querySelectorAll(".hero-word") ?? [],
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power3.out" },
          "-=0.4"
        )
        .to(
          subtitleRef.current,
          { y: 0, opacity: 1, duration: 0.8 },
          "-=0.5"
        )
        .to(
          cardsRef.current?.children ?? [],
          { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" },
          "-=0.3"
        )

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 80%",
        end: "bottom 20%",
        animation: tl,
        once: true,
      })
    }, containerRef)

    return () => ctx.revert()
  }, [reduce])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden border-b border-border/30 bg-gradient-radial py-20"
    >
      <div className="container mx-auto px-4 text-center">
        <div
          ref={iconRef}
          className="mx-auto mb-6 flex h-16 w-16 scale-0 items-center justify-center rounded-2xl bg-primary/10 opacity-0 ring-1 ring-primary/30"
          style={{ rotate: "-30deg" }}
        >
          <ListChecks className="h-8 w-8 text-primary" />
        </div>

        <h1
          ref={titleRef}
          className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          <span className="hero-word mr-[0.3em] inline-block translate-y-10 opacity-0">
            Crie
          </span>
          <span className="hero-word mr-[0.3em] inline-block translate-y-10 opacity-0">
            listas
          </span>
          <span className="hero-word mr-[0.3em] inline-block translate-y-10 opacity-0">
            de
          </span>
          <span className="hero-word mr-[0.3em] inline-block translate-y-10 opacity-0">
            <span className="text-gradient">votação</span>
          </span>
          <span className="hero-word mr-[0.3em] inline-block translate-y-10 opacity-0">
            <span className="text-gradient">elegantes</span>
          </span>
        </h1>

        <p
          ref={subtitleRef}
          className="mx-auto mt-4 max-w-2xl translate-y-6 text-lg text-muted-foreground opacity-0"
        >
          Convide participantes, adicione candidatos e acompanhe os resultados em tempo real
          com uma experiência visual moderna e imersiva.
        </p>

        <div
          ref={cardsRef}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <FeatureCard
            icon={<Vote className="h-6 w-6" />}
            title="Votação simples"
            description="Um clique para votar e acompanhar o ranking ao vivo."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Participantes"
            description="Convide pessoas por email para participar das suas listas."
          />
          <FeatureCard
            icon={<ListChecks className="h-6 w-6" />}
            title="Listas ilimitadas"
            description="Crie quantas listas quiser, com ou sem data de expiração."
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}) {
  return (
    <div
      className={`glass translate-y-8 scale-95 rounded-xl p-5 text-left opacity-0 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 ${className ?? ""}`}
    >
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
