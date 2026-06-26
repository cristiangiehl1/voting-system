import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useCancelInvite(listId: string, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await api.cancelInvite(inviteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites(listId) })
      onSuccess?.()
    },
    onError,
  })
}
