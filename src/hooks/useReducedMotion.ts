"use client"

import { useState, useEffect } from "react"

interface NetworkInfo {
  effectiveType: string
  saveData: boolean
  addEventListener: (event: string, handler: () => void) => void
  removeEventListener: (event: string, handler: () => void) => void
}

export function useReducedMotion(): boolean {
  const [shouldReduce, setShouldReduce] = useState(true)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")

    const check = () => {
      const isMobile = window.innerWidth < 768
      const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection
      const isSlow = conn?.effectiveType === "slow-2g" || conn?.saveData === true
      setShouldReduce(mql.matches || isMobile || isSlow)
    }

    check()

    mql.addEventListener("change", check)
    window.addEventListener("resize", check)

    const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection
    conn?.addEventListener("change", check)

    return () => {
      mql.removeEventListener("change", check)
      window.removeEventListener("resize", check)
      conn?.removeEventListener("change", check)
    }
  }, [])

  return shouldReduce
}
