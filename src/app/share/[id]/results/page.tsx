import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { serverApi } from "@/lib/server-api"
import { queryKeys } from "@/lib/query-keys"
import { notFound } from "next/navigation"
import ShareResultsContent from "./_ShareResultsContent"

export default async function ShareResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = new QueryClient()

  const list = await serverApi.getPublicList(id)
  if (!list) notFound()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.publicList(id),
      queryFn: () => list,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.publicResults(id),
      queryFn: () => serverApi.getPublicResults(id),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ShareResultsContent />
    </HydrationBoundary>
  )
}
