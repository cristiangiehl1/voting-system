import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { serverApi } from "@/lib/server-api"
import { queryKeys } from "@/lib/query-keys"
import ResultsPageContent from "./_ResultsContent"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = new QueryClient()

  const list = await serverApi.getList(id)

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.list(id),
      queryFn: () => list,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.results(id),
      queryFn: () => serverApi.getResults(id),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResultsPageContent />
    </HydrationBoundary>
  )
}
