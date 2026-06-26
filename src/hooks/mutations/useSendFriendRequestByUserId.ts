import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useSendFriendRequestByUserId(onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.sendFriendRequestByUserId(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends })
      onSuccess?.()
    },
    onError,
  })
}
