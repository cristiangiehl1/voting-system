"use server"

import { hash } from "bcryptjs"
import { findUserByEmail, createUser } from "@/lib/repositories/user.repository"

export async function registerUser(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    return { error: "Todos os campos são obrigatórios" } as const
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres" } as const
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    return { error: "Este email já está registrado" } as const
  }

  const passwordHash = await hash(password, 10)

  await createUser({ email, name, passwordHash })

  return { success: true } as const
}
