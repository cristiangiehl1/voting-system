"use client"

import { useRef, useLayoutEffect, useState } from "react"
import gsap from "gsap"

export function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [displayValue, setDisplayValue] = useState(value)

  useLayoutEffect(() => {
    if (!ref.current) return

    const obj = { val: displayValue }
    const tween = gsap.to(obj, {
      val: value,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => setDisplayValue(Math.round(obj.val)),
    })

    return () => {
      tween.kill()
    }
  }, [value, displayValue])

  return <span ref={ref}>{displayValue}</span>
}
