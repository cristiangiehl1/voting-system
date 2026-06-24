"use server"

import { hash } from "bcryptjs"
import jwt from "jsonwebtoken"
import { findUserByEmail, createUser, updateUserVerification } from "@/lib/repositories/user.repository"
import { sendVerificationEmail } from "@/lib/email"

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret"

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

  const user = await createUser({ email, name, passwordHash })

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "24h" }
  )

  await updateUserVerification(user.id, token)

  try {
    await sendVerificationEmail(email, name, token)
  } catch {
    return { error: "Erro ao enviar email de verificação" } as const
  }

  return { success: true, email } as const
}

export async function verifyEmailToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    const user = await findUserByEmail(payload.email)
    if (!user) return { error: "Usuário não encontrado" } as const
    if (user.verificationToken !== token) return { error: "Token inválido" } as const

    await updateUserVerification(user.id, null)

    return { success: true, userId: user.id } as const
  } catch {
    return { error: "Token inválido ou expirado" } as const
  }
}
