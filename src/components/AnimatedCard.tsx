"use client"

import { type ReactNode } from "react"
import { Card } from "@/components/ui/card"

export function AnimatedCard({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <Card
      className={`card-hover animate-in ${className ?? ""}`}
      style={style}
    >
      {children}
    </Card>
  )
}
