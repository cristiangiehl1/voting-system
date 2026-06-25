import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getList, getOptions, getParticipants, getMyVotes, getMyLists } from "@/app/actions/lists"
import { auth } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"

export default async function ListLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = new QueryClient()
  const session = await auth()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.list(id),
      queryFn: () => getList(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.options(id),
      queryFn: () => getOptions(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.participants(id),
      queryFn: () => getParticipants(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.lists,
      queryFn: () => getMyLists(),
    }),
    ...(session?.user?.id
      ? [
          queryClient.prefetchQuery({
            queryKey: queryKeys.myVotes(id),
            queryFn: () => getMyVotes(id),
          }),
        ]
      : []),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
