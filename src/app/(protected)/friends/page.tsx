import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import FriendsContent from "./_FriendsContent"

export default async function FriendsPage() {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: queryKeys.friends,
    queryFn: () => api.getFriends(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FriendsContent />
    </HydrationBoundary>
  )
}
