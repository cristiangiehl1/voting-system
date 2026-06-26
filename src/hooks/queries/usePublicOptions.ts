import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function usePublicOptions(listId: string) {
  return useQuery({
    queryKey: queryKeys.publicOptions(listId),
    queryFn: () => api.getPublicOptions(listId),
    enabled: !!listId,
  })
}
