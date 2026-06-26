import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function usePublicLists() {
  return useQuery({
    queryKey: queryKeys.publicLists,
    queryFn: () => api.getPublicLists(),
  })
}
