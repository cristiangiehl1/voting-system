"use client"

import { useRef, useLayoutEffect, type ReactNode } from "react"
import gsap from "gsap"
import { Card } from "@/components/ui/card"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function AnimatedCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (!cardRef.current || reduce) return

    const card = cardRef.current

    const onEnter = () => {
      gsap.to(card, {
        y: -6,
        scale: 1.02,
        borderColor: "oklch(0.7 0.18 260 / 0.5)",
        boxShadow: "0 24px 48px -12px rgba(100, 120, 255, 0.2)",
        duration: 0.4,
        ease: "power2.out",
      })
    }

    const onLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        borderColor: "",
        boxShadow: "0 0 0 0 rgba(0,0,0,0)",
        duration: 0.4,
        ease: "power2.out",
      })
    }

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -4
      const rotateY = ((x - centerX) / centerX) * 4

      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.6,
        ease: "power2.out",
      })
    }

    const onLeaveMove = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "power2.out",
      })
    }

    const onLeaveCombined = () => { onLeave(); onLeaveMove() }

    card.addEventListener("mouseenter", onEnter)
    card.addEventListener("mouseleave", onLeaveCombined)
    card.addEventListener("mousemove", onMove)

    return () => {
      card.removeEventListener("mouseenter", onEnter)
      card.removeEventListener("mouseleave", onLeaveCombined)
      card.removeEventListener("mousemove", onMove)
    }
  }, [reduce])

  return (
    <Card ref={cardRef} className={className}>
      {children}
    </Card>
  )
}
