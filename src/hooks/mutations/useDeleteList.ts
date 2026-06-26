import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useDeleteList(onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) => {
      await api.deleteList(listId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      onSuccess?.()
    },
    onError,
  })
}
