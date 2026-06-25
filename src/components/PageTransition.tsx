"use client"

import { useRef, useLayoutEffect, type ReactNode } from "react"
import gsap from "gsap"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function PageTransition({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (!containerRef.current) return

    if (reduce) {
      gsap.set(containerRef.current, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 24, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
        }
      )
    }, containerRef)

    return () => ctx.kill()
  }, [reduce])

  return (
    <div ref={containerRef} className="opacity-0">
      {children}
    </div>
  )
}
