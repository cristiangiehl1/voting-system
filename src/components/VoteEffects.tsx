"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import { toast } from "sonner"

export function useVoteConfetti() {
  return () => {
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#00f0ff", "#ff00aa", "#aaff00"],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#ff00aa", "#aaff00", "#00f0ff"],
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }
}

export function useAchievementToast() {
  return (achievements: { key: string; name: string; icon: string }[]) => {
    for (const ach of achievements) {
      confetti({
        particleCount: 30,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#00f0ff", "#ff00aa", "#aaff00"],
      })
      setTimeout(() => {
        toast.success(`${ach.icon} Conquista desbloqueada: ${ach.name}!`, {
          duration: 5000,
          style: { border: "1px solid #00f0ff", color: "#00f0ff" },
        })
      }, 200)
    }
  }
}

export function useFloatingEmojis() {
  const [show, setShow] = useState(false)
  const trigger = () => {
    setShow(true)
    setTimeout(() => setShow(false), 4000)
  }
  return { show, trigger }
}

export function MemeReaction({ memeUrl, onDone }: { memeUrl: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative max-w-md rounded-xl border-2 border-neon-cyan/50 bg-background p-2 shadow-2xl shadow-neon-cyan/20">
        <img
          src={memeUrl}
          alt="meme reaction"
          className="h-auto w-full rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none"
          }}
        />
        <p className="mt-2 text-center text-xs text-neon-cyan animate-neon-pulse">
          VOTO REGISTRADO COM MEME!
        </p>
      </div>
    </div>
  )
}
