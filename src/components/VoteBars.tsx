export function VoteBars({
  data,
}: {
  data: { name: string; value: number; color?: string }[]
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.value / max) * 100
        return (
          <div key={index} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="font-mono text-muted-foreground">{item.value}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-1000"
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
