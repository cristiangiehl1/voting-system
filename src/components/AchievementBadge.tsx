"use client"

type AchievementBadgeProps = {
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
}

export function AchievementBadge({ name, description, icon, unlocked, unlockedAt }: AchievementBadgeProps) {
  return (
    <div
      className={`group relative flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all duration-300 ${
        unlocked
          ? "border-neon-cyan/40 bg-neon-cyan/5 shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:border-neon-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          : "border-border/40 bg-card/30 opacity-50 grayscale"
      }`}
    >
      <span className={`text-4xl transition-transform duration-300 ${unlocked ? "group-hover:scale-125" : ""}`}>
        {icon}
      </span>
      <div>
        <p className={`text-sm font-bold ${unlocked ? "text-neon-cyan" : "text-muted-foreground"}`}>
          {name}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
          {description}
        </p>
        {unlocked && unlockedAt && (
          <p className="mt-1 text-[9px] text-neon-cyan/60">
            {new Date(unlockedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  )
}
