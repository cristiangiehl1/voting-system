import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useSendFriendRequest(onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      await api.sendFriendRequest(email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends })
      onSuccess?.()
    },
    onError,
  })
}
