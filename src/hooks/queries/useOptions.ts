import { useInfiniteQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useOptions(listId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.options(listId),
    queryFn: ({ pageParam }) => api.getOptionsPaginated(listId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!listId,
  })
}
