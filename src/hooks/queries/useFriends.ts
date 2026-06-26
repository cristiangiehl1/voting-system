import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useFriends(enabled?: boolean) {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: () => api.getFriends(),
    enabled,
  })
}
