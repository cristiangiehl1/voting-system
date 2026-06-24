"use client"

import { useRef, useLayoutEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ListChecks, Vote, Users, BarChart3 } from "lucide-react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const STATS = [
  { icon: ListChecks, value: 6, label: "Listas criadas" },
  { icon: Users, value: 24, label: "Participantes" },
  { icon: Vote, value: 156, label: "Votos computados" },
  { icon: BarChart3, value: 12, label: "Resultados" },
]

function AnimatedCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = Math.floor(obj.val).toLocaleString("pt-BR")
        },
      })
    }, el)

    return () => ctx.revert()
  }, [target])

  return <span ref={ref}>0</span>
}

export function AnimatedHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const orb3Ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (!containerRef.current) return

    if (reduce) {
      gsap.set(titleRef.current?.querySelectorAll(".hero-word") ?? [], { y: 0, opacity: 1 })
      gsap.set(subtitleRef.current, { y: 0, opacity: 1 })
      gsap.set(featuresRef.current?.children ?? [], { y: 0, opacity: 1, scale: 1 })
      gsap.set(statsRef.current?.children ?? [], { y: 0, opacity: 1 })
      gsap.set([orb1Ref.current, orb2Ref.current, orb3Ref.current], { opacity: 1, scale: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          end: "bottom 10%",
          toggleActions: "play none none reverse",
        },
      })

      tl.to([orb1Ref.current, orb2Ref.current, orb3Ref.current], {
        opacity: 0.6,
        scale: 1,
        duration: 1.2,
        stagger: 0.2,
        ease: "back.out(1.7)",
      })
        .to(
          titleRef.current?.querySelectorAll(".hero-word") ?? [],
          { y: 0, opacity: 1, duration: 1, stagger: 0.06, ease: "power3.out" },
          "-=0.6"
        )
        .to(
          subtitleRef.current,
          { y: 0, opacity: 1, duration: 0.8 },
          "-=0.5"
        )
        .to(
          featuresRef.current?.children ?? [],
          { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" },
          "-=0.3"
        )
        .to(
          statsRef.current?.children ?? [],
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" },
          "-=0.2"
        )
    }, containerRef)

    return () => ctx.revert()
  }, [reduce])

  const words = "Crie listas de votação elegantes".split(" ")

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden border-b border-border/30"
    >
      <div className="absolute inset-0 bg-gradient-radial" />

      <div
        ref={orb1Ref}
        className="absolute -top-20 -left-20 h-80 w-80 scale-0 rounded-full opacity-0"
        style={{
          background: "radial-gradient(circle, oklch(0.7 0.2 260 / 0.15), transparent 70%)",
        }}
      />
      <div
        ref={orb2Ref}
        className="absolute -bottom-20 -right-20 h-96 w-96 scale-0 rounded-full opacity-0"
        style={{
          background: "radial-gradient(circle, oklch(0.75 0.2 320 / 0.12), transparent 70%)",
        }}
      />
      <div
        ref={orb3Ref}
        className="absolute top-1/2 left-1/3 h-64 w-64 scale-0 rounded-full opacity-0"
        style={{
          background: "radial-gradient(circle, oklch(0.7 0.2 200 / 0.1), transparent 70%)",
        }}
      />

      <div className="container relative mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Plataforma de votação em tempo real
          </div>

          <h1
            ref={titleRef}
            className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          >
            {words.map((word, i) => (
              <span
                key={i}
                className={`hero-word mr-[0.25em] inline-block translate-y-12 opacity-0 ${
                  i >= words.length - 2 ? "text-gradient-premium" : ""
                }`}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            ref={subtitleRef}
            className="mx-auto mt-6 max-w-2xl translate-y-6 text-lg text-muted-foreground opacity-0 md:text-xl"
          >
            Convide participantes, adicione candidatos e acompanhe os resultados em tempo real
            com uma experiência visual moderna, imersiva e totalmente responsiva.
          </p>

          <div
            ref={featuresRef}
            className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <FeatureCard
              icon={<Vote className="h-5 w-5" />}
              title="Votação simples"
              description="Um clique para votar e acompanhar o ranking ao vivo."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Participantes"
              description="Convide pessoas por email para participar das suas listas."
            />
            <FeatureCard
              icon={<ListChecks className="h-5 w-5" />}
              title="Listas ilimitadas"
              description="Crie quantas listas quiser, com ou sem data de expiração."
            />
          </div>
        </div>

        <div
          ref={statsRef}
          className="mx-auto mt-16 grid max-w-3xl translate-y-8 grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/30 opacity-0 md:grid-cols-4"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 bg-card/50 px-4 py-6 text-center backdrop-blur-sm"
            >
              <stat.icon className="h-5 w-5 text-primary/60" />
              <span className="text-2xl font-bold tracking-tight">
                <AnimatedCounter target={stat.value} />+
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group glass-premium translate-y-8 scale-95 rounded-xl p-5 text-left opacity-0 transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary ring-1 ring-primary/20 transition-all group-hover:bg-primary/15 group-hover:ring-primary/40">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
