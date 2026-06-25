import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha"),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Senhas não conferem", path: ["confirmPassword"] }
)

export const createListSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  expiresAt: z.string().optional(),
  revealVotes: z.boolean().optional(),
  allowMultipleVotes: z.boolean().optional(),
  rankedVoting: z.boolean().optional(),
  maxRank: z.number().int().min(1).max(10).optional(),
  allowParticipantsToAddOptions: z.boolean().optional(),
  image: z.instanceof(File).optional(),
  isPublic: z.boolean().optional(),
}).refine(
  (data) => !data.rankedVoting || data.allowMultipleVotes,
  { message: "Votação por ranking requer votos múltiplos ativos", path: ["rankedVoting"] }
)

export const createOptionSchema = z.object({
  listId: z.string().min(1, "Selecione uma lista"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  referenceUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  image: z.instanceof(File).optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
})

export const addParticipantSchema = z.object({
  listId: z.string().min(1, "Selecione uma lista"),
  email: z.string().email("Email inválido"),
})

export const updateListSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  revealVotes: z.boolean(),
  allowMultipleVotes: z.boolean(),
  rankedVoting: z.boolean().optional(),
  maxRank: z.number().int().min(1).max(10).optional(),
  allowParticipantsToAddOptions: z.boolean().optional(),
  image: z.instanceof(File).optional(),
  isPublic: z.boolean().optional(),
}).refine(
  (data) => !data.rankedVoting || data.allowMultipleVotes,
  { message: "Votação por ranking requer votos múltiplos ativos", path: ["rankedVoting"] }
)

export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type CreateListData = z.infer<typeof createListSchema>
export type CreateOptionData = z.infer<typeof createOptionSchema>
export type AddParticipantData = z.infer<typeof addParticipantSchema>
export type UpdateListData = z.infer<typeof updateListSchema>
export const inviteSchema = z.object({
  listId: z.string().min(1, "Selecione uma lista"),
  email: z.string().email("Email inválido"),
})

export type InviteData = z.infer<typeof inviteSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>
