import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useNotifications(enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.getMyNotifications(),
    enabled,
    refetchInterval: 15_000,
  })
}
