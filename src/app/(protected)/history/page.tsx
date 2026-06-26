import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { HistoryContent } from "./HistoryContent"

export default async function HistoryPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: queryKeys.votingHistory,
    queryFn: () => api.getMyVotingHistory(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HistoryContent />
    </HydrationBoundary>
  )
}
