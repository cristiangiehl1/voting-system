import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

export function useCreateList(onSuccess?: (listId: string) => void, onError?: (error: Error) => void) {
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.createList>[0] & { imageId?: string; imageUrl?: string }) => {
      return api.createList(data)
    },
    onSuccess,
    onError,
  })
}
