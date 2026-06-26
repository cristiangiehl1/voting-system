import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useUpdateAvatar(onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { imageId: string | null; imageUrl: string | null }) => {
      await api.updateUserProfile(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      onSuccess?.()
    },
    onError,
  })
}
