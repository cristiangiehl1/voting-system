import { z } from "zod"

export const sendFriendRequestSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  userId: z.string().optional(),
}).refine((data) => data.email || data.userId, {
  message: "Email ou ID do usuário é obrigatório",
})

export type SendFriendRequestData = z.infer<typeof sendFriendRequestSchema>
