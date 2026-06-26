export function ResultsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 h-9 w-24 animate-pulse rounded bg-muted" />
      <div className="mb-8 flex flex-col items-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-2xl bg-muted" />
        <div className="mx-auto h-9 w-64 animate-pulse rounded bg-muted" />
        <div className="mx-auto mt-2 h-5 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted" />
              </div>
              <div className="h-8 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}
