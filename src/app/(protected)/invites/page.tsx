import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { serverApi } from "@/lib/server-api"
import { queryKeys } from "@/lib/query-keys"
import InvitesPageContent from "./_InvitesContent"

export default async function InvitesPage() {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: queryKeys.myInvites,
    queryFn: () => serverApi.getMyInvites(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvitesPageContent />
    </HydrationBoundary>
  )
}
