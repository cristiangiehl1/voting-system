import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getResults, getList } from "@/app/actions/lists"
import { queryKeys } from "@/lib/query-keys"
import ResultsPageContent from "./_ResultsContent"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.list(id),
      queryFn: () => getList(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.results(id),
      queryFn: () => getResults(id),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResultsPageContent />
    </HydrationBoundary>
  )
}
