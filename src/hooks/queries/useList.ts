import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useList(listId: string) {
  return useQuery({
    queryKey: queryKeys.list(listId),
    queryFn: () => api.getList(listId),
    enabled: !!listId,
  })
}
