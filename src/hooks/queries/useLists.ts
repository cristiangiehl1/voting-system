import { useInfiniteQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useLists(enabled?: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.lists,
    queryFn: ({ pageParam }) => api.getMyListsPaginated(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  })
}
