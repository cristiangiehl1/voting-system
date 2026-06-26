import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useAddParticipant(listId: string, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      await api.inviteParticipant(listId, email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) })
      onSuccess?.()
    },
    onError,
  })
}
