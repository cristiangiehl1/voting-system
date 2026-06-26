import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import jwt from "jsonwebtoken"
import { findUserByEmail, createUser, updateUserVerification } from "@/lib/repositories/user.repository"
import { sendVerificationEmail } from "@/lib/email"

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret"

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "Este email já está registrado" }, { status: 409 })
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
    return NextResponse.json({ error: "Erro ao enviar email de verificação" }, { status: 500 })
  }

  return NextResponse.json({ success: true, email })
}
