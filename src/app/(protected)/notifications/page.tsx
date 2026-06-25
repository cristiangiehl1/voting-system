import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getMyNotifications, countUnreadNotifications } from "@/app/actions/lists"
import { auth } from "@/lib/auth"
import { queryKeys } from "@/lib/query-keys"
import { NotificationsContent } from "./NotificationsContent"

export default async function NotificationsPage() {
  const session = await auth()
  const queryClient = new QueryClient()

  if (session?.user?.id) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.notifications,
        queryFn: () => getMyNotifications(),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.notificationCount,
        queryFn: () => countUnreadNotifications(),
      }),
    ])
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsContent />
    </HydrationBoundary>
  )
}
