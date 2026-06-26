import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useInvites(listId: string, enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.invites(listId),
    queryFn: () => api.getInvites(listId),
    enabled: !!listId && enabled,
  })
}
