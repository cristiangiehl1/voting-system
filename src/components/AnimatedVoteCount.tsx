"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

export function AnimatedVoteCount({ count, className }: { count: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevCount = useRef(count)

  useEffect(() => {
    if (!ref.current) return
    if (prevCount.current === count) return

    gsap.fromTo(
      ref.current,
      { scale: 1.6, color: "#00f0ff" },
      { scale: 1, color: "#ff00aa", duration: 0.4, ease: "back.out(2)" }
    )
    prevCount.current = count
  }, [count])

  return (
    <span ref={ref} className={className}>
      {count}
    </span>
  )
}
