import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getPublicLists, getMyListsPaginated } from "@/app/actions/lists"
import { auth } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import ListsPageContent from "./_ListsContent"

export default async function ListsPage() {
  const queryClient = new QueryClient()
  const session = await auth()

  if (session?.user?.id) {
    await Promise.all([
      queryClient.prefetchInfiniteQuery({
        queryKey: queryKeys.lists,
        queryFn: ({ pageParam }) => getMyListsPaginated(pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.publicLists,
        queryFn: () => getPublicLists(),
      }),
    ])
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListsPageContent />
    </HydrationBoundary>
  )
}
