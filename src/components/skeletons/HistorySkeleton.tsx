export function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
          <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
          <div className="mb-2 h-4 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
