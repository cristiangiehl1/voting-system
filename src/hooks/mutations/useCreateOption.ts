import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useCreateOption(listId: string, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; referenceUrl?: string; imageId?: string; imageUrl?: string }) => {
      await api.createOption(listId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
      onSuccess?.()
    },
    onError,
  })
}
