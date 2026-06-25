"use client"

import { type ReactNode } from "react"
import { Card } from "@/components/ui/card"

export function AnimatedCard({
  children,
  className,
  style,
  onClick,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}) {
  return (
    <Card
      className={`card-hover animate-in ${onClick ? "cursor-pointer" : ""} ${className ?? ""}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </Card>
  )
}
