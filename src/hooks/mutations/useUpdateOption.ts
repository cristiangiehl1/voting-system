import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useUpdateOption(listId: string, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { optionId: string; name: string; description?: string; referenceUrl?: string; imageId?: string; imageUrl?: string }) => {
      await api.updateOption(data.optionId, {
        name: data.name,
        description: data.description,
        referenceUrl: data.referenceUrl,
        imageId: data.imageId,
        imageUrl: data.imageUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      onSuccess?.()
    },
    onError,
  })
}
