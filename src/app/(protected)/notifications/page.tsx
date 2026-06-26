import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { serverApi } from "@/lib/server-api"
import { queryKeys } from "@/lib/query-keys"
import { NotificationsContent } from "./NotificationsContent"

export default async function NotificationsPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.notifications,
      queryFn: () => serverApi.getMyNotifications(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.notificationCount,
      queryFn: () => serverApi.countUnreadNotifications(),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsContent />
    </HydrationBoundary>
  )
}
