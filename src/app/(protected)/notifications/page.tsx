import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { NotificationsContent } from "./NotificationsContent"

export default async function NotificationsPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.notifications,
      queryFn: () => api.getMyNotifications(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.notificationCount,
      queryFn: () => api.countUnreadNotifications(),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsContent />
    </HydrationBoundary>
  )
}
