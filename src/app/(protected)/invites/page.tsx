import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import InvitesPageContent from "./_InvitesContent"

export default async function InvitesPage() {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: queryKeys.myInvites,
    queryFn: () => api.getMyInvites(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvitesPageContent />
    </HydrationBoundary>
  )
}
