import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getPublicList, getPublicOptions, getMyVotes } from "@/app/actions/lists"
import { auth } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import { notFound } from "next/navigation"
import ShareContent from "./_ShareContent"

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = new QueryClient()
  const session = await auth()

  const list = await getPublicList(id)
  if (!list) notFound()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.publicList(id),
      queryFn: () => getPublicList(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.publicOptions(id),
      queryFn: () => getPublicOptions(id),
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
      <ShareContent />
    </HydrationBoundary>
  )
}
