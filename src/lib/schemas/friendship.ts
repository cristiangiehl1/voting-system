import { z } from "zod"

export const sendFriendRequestSchema = z.object({
  email: z.string().email("Email inválido"),
})

export type SendFriendRequestData = z.infer<typeof sendFriendRequestSchema>
