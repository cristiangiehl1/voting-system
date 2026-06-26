import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useResults(listId: string) {
  return useQuery({
    queryKey: queryKeys.results(listId),
    queryFn: () => api.getResults(listId),
    enabled: !!listId,
    refetchInterval: 10000,
  })
}
