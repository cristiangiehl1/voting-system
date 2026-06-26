import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { findUserByEmail, updateUserResetToken } from "@/lib/repositories/user.repository"
import { sendResetPasswordEmail } from "@/lib/email"

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret"

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
  }

  const user = await findUserByEmail(email)

  if (!user || !user.emailVerified) {
    return NextResponse.json({ success: true })
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  )

  await updateUserResetToken(user.id, token)

  try {
    await sendResetPasswordEmail(email, user.name || "usuário", token)
  } catch {
    return NextResponse.json({ error: "Erro ao enviar email de recuperação" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
