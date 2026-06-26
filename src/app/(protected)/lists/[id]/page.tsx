import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { serverApi } from "@/lib/server-api"
import { auth } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import ListPageContent from "./_ListContent"

export default async function ListPage({
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
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.options(id),
      queryFn: ({ pageParam }) => serverApi.getOptionsPaginated(id, pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.participants(id),
      queryFn: () => serverApi.getParticipants(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.myVotes(id),
      queryFn: () => serverApi.getMyVotes(id),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListPageContent />
    </HydrationBoundary>
  )
}
