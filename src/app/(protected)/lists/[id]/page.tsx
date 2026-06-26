import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import ListPageContent from "./_ListContent"

export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = new QueryClient()

  const list = await api.getList(id)

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.list(id),
      queryFn: () => list,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.options(id),
      queryFn: ({ pageParam }) => api.getOptionsPaginated(id, pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.participants(id),
      queryFn: () => api.getParticipants(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.myVotes(id),
      queryFn: () => api.getMyVotes(id),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListPageContent />
    </HydrationBoundary>
  )
}
