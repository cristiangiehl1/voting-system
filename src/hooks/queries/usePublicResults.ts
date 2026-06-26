import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function usePublicResults(listId: string) {
  return useQuery({
    queryKey: queryKeys.publicResults(listId),
    queryFn: () => api.getPublicResults(listId),
    enabled: !!listId,
    refetchInterval: 10000,
  })
}
