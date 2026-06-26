import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useUpdateName(onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      await api.updateUserProfile({ name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      onSuccess?.()
    },
    onError,
  })
}
