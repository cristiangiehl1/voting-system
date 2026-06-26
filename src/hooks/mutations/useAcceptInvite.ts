import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useAcceptInvite(onSuccess?: (listId: string) => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ inviteId }: { inviteId: string; listId: string }) => {
      await api.acceptInvite(inviteId)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myInvites })
      queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      onSuccess?.(variables.listId)
    },
    onError,
  })
}
