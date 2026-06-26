import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function usePublicList(listId: string) {
  return useQuery({
    queryKey: queryKeys.publicList(listId),
    queryFn: () => api.getPublicList(listId),
    enabled: !!listId,
  })
}
