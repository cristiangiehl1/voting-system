import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useUpdateList(listId: string, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await api.updateList(listId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      onSuccess?.()
    },
    onError,
  })
}
