"use client"

import { useRef, useLayoutEffect } from "react"
import gsap from "gsap"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function VoteBars({
  data,
}: {
  data: { name: string; value: number; color?: string }[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const max = Math.max(...data.map((d) => d.value), 1)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (!containerRef.current || reduce) return

    const bars = containerRef.current.querySelectorAll(".vote-bar-fill")
    const counts = containerRef.current.querySelectorAll(".vote-bar-count")

    const ctx = gsap.context(() => {
      gsap.from(bars, {
        scaleX: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.08,
        transformOrigin: "left center",
      })

      counts.forEach((el) => {
        const target = parseInt(el.getAttribute("data-target") || "0", 10)
        const obj = { val: 0 }
        gsap.to(obj, {
          val: target,
          duration: 1,
          ease: "power2.out",
          delay: 0.3,
          onUpdate: () => {
            el.textContent = Math.round(obj.val).toString()
          },
        })
      })
    }, containerRef)

    return () => ctx.kill()
  }, [data, reduce])

  return (
    <div ref={containerRef} className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.value / max) * 100
        return (
          <div key={index} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span
                className="vote-bar-count font-mono text-muted-foreground"
                data-target={item.value}
              >
                0
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="vote-bar-fill h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color || "var(--primary)",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
