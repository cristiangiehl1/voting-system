import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { serverApi } from "@/lib/server-api"
import { queryKeys } from "@/lib/query-keys"
import ListsPageContent from "./_ListsContent"

export default async function ListsPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.lists,
      queryFn: ({ pageParam }) => serverApi.getMyListsPaginated(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.publicLists,
      queryFn: () => serverApi.getPublicLists(),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListsPageContent />
    </HydrationBoundary>
  )
}
