export function ListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      <div className="flex justify-center">
        <div className="aspect-square w-full max-w-md animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-4">
          <div className="h-4 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-44 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-card">
            <div className="aspect-square w-full animate-pulse bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
