import { z } from "zod"

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

export type CreateListData = z.infer<typeof createListSchema>
export type UpdateListData = z.infer<typeof updateListSchema>
