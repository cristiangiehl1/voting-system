import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useNotificationCount(enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.notificationCount,
    queryFn: () => api.countUnreadNotifications(),
    enabled,
    refetchInterval: 15_000,
  })
}
