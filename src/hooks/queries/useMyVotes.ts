import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useMyVotes(listId: string, enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.myVotes(listId),
    queryFn: () => api.getMyVotes(listId),
    enabled: !!listId && enabled,
  })
}
