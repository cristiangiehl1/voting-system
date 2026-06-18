import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const createRankingSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
})

export const createCandidateSchema = z.object({
  rankingId: z.string().min(1, "Selecione um ranking"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
})

export const voteSchema = z.object({
  comment: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
})

export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type CreateRankingData = z.infer<typeof createRankingSchema>
export type CreateCandidateData = z.infer<typeof createCandidateSchema>
export type VoteData = z.infer<typeof voteSchema>
