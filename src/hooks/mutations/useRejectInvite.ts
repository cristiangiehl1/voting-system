import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useRejectInvite(onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await api.rejectInvite(inviteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myInvites })
      onSuccess?.()
    },
    onError,
  })
}
