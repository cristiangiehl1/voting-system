import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>
