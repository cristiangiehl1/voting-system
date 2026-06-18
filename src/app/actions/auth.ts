"use server"

import { prisma } from "@/lib/prisma"
import { fetchRandomMeme } from "@/lib/meme"

export async function registerUser(name: string, email: string, password: string) {
  if (!name || !email || !password) {
    return { error: "Todos os campos são obrigatórios" } as const
  }

  const teamPassword = process.env.AUTH_SECRET?.slice(0, 8)
  if (password !== teamPassword) {
    return { error: "Senha do time inválida" } as const
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Este email já está registrado" } as const
  }

  const avatar = await fetchRandomMeme()

  await prisma.user.create({
    data: { email, name, image: avatar },
  })

  return { success: true } as const
}
