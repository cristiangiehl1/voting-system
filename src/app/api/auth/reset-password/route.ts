import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import jwt from "jsonwebtoken"
import { findUserByEmail, updateUserPassword } from "@/lib/repositories/user.repository"

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret"

export async function POST(req: Request) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: "Token e senha são obrigatórios" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  let payload: { userId: string; email: string; purpose?: string }
  try {
    payload = jwt.verify(token, JWT_SECRET) as typeof payload
    if (payload.purpose !== "reset-password") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 })
  }

  const user = await findUserByEmail(payload.email)
  if (!user || user.resetToken !== token) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 })
  }

  const passwordHash = await hash(password, 10)
  await updateUserPassword(user.id, passwordHash)

  return NextResponse.json({ success: true })
}
