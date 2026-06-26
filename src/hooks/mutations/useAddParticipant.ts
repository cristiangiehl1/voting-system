import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useAddParticipant(
  listId: string,
  onSuccess?: (data: { invited: number; errors: { email: string; error: string }[] }) => void,
  onError?: (error: Error) => void,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (emails: string[]) => {
      return api.inviteParticipants(listId, emails)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.list(listId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.invites(listId) })
      onSuccess?.(data)
    },
    onError,
  })
}
