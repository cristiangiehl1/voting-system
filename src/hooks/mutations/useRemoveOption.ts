import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useRemoveOption(listId: string, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (optionId: string) => {
      await api.removeOption(optionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      onSuccess?.()
    },
    onError,
  })
}
