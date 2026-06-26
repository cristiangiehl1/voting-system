import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
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

  const list = await api.getPublicList(id)
  if (!list) notFound()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.publicList(id),
      queryFn: () => list,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.publicOptions(id),
      queryFn: () => api.getPublicOptions(id),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.myVotes(id),
      queryFn: () => api.getMyVotes(id),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ShareContent />
    </HydrationBoundary>
  )
}
