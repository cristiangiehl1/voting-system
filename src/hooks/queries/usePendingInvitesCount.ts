import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function usePendingInvitesCount(enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.myInvites, "count"],
    queryFn: () => api.countMyPendingInvites(),
    enabled,
    refetchInterval: 30_000,
  })
}
