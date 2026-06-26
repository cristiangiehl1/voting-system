import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export function useSubmitRankedVotes(listId: string, isPublic?: boolean, onSuccess?: () => void, onError?: (error: Error) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rankings: Array<{ optionId: string; rank: number }>) => {
      await api.submitRankedVotes(listId, rankings)
    },
    onSuccess: () => {
      if (isPublic) {
        queryClient.invalidateQueries({ queryKey: queryKeys.publicOptions(listId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.publicResults(listId) })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.options(listId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.results(listId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(listId) })
      onSuccess?.()
    },
    onError,
  })
}
