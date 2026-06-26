import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useParticipants(listId: string) {
  return useQuery({
    queryKey: queryKeys.participants(listId),
    queryFn: () => api.getParticipants(listId),
    enabled: !!listId,
  })
}
