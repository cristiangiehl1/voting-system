import { z } from "zod"

export const addParticipantSchema = z.object({
  listId: z.string().min(1, "Selecione uma lista"),
  email: z.string().email("Email inválido"),
})

export const inviteSchema = z.object({
  listId: z.string().min(1, "Selecione uma lista"),
  email: z.string().email("Email inválido"),
})

export type AddParticipantData = z.infer<typeof addParticipantSchema>
export type InviteData = z.infer<typeof inviteSchema>
