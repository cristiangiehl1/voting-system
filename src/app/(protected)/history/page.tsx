import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getMyVotingHistory } from "@/app/actions/lists"
import { auth } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import { HistoryContent } from "./HistoryContent"

export default async function HistoryPage() {
  const session = await auth()
  const queryClient = new QueryClient()

  if (session?.user?.id) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.votingHistory,
      queryFn: () => getMyVotingHistory(),
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HistoryContent />
    </HydrationBoundary>
  )
}
