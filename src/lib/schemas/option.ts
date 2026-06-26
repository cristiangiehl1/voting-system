import { z } from "zod"

export const createOptionSchema = z.object({
  listId: z.string().min(1, "Selecione uma lista"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  referenceUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  image: z.instanceof(File).optional(),
})

export type CreateOptionData = z.infer<typeof createOptionSchema>
