import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getMyInvites } from "@/app/actions/lists"
import { auth } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import InvitesPageContent from "./_InvitesContent"

export default async function InvitesPage() {
  const queryClient = new QueryClient()
  const session = await auth()

  if (session?.user?.id) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.myInvites,
      queryFn: () => getMyInvites(),
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvitesPageContent />
    </HydrationBoundary>
  )
}
