export function InvitesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
          <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
          <div className="mb-4 h-4 w-1/3 rounded bg-muted" />
          <div className="mb-6 h-4 w-1/2 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded bg-muted" />
            <div className="h-9 flex-1 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
