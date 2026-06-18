"use client"

import { useEffect, useState } from "react"

const EMOJIS = ["🎯", "💀", "🔥", "⚡", "🖥️", "⌨️", "💻", "🚀", "👻", "💾"]

type Particle = {
  id: number
  emoji: string
  x: number
  delay: number
  duration: number
  size: number
}

export function FloatingEmojis() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const items: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      size: 1 + Math.random() * 0.8,
    }))
    setParticles(items)
    const timer = setTimeout(() => setParticles([]), 3500)
    return () => clearTimeout(timer)
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 animate-emoji-rise"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
