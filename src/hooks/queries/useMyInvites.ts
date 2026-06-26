import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useMyInvites(enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.myInvites,
    queryFn: () => api.getMyInvites(),
    enabled,
  })
}
