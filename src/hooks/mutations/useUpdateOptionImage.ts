import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useUpdateOptionImage(listId: string, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ optionId, imageId, imageUrl }: { optionId: string; imageId: string; imageUrl: string }) => {
      await api.updateOptionImage(optionId, imageId, imageUrl)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      onSuccess?.()
    },
    onError,
  })
}
