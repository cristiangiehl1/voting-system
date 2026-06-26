import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useAcceptFriendRequest(onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (friendId: string) => {
      await api.acceptFriendRequest(friendId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends })
      onSuccess?.()
    },
    onError,
  })
}
