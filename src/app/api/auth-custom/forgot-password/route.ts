import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { findUserByEmail, updateUserResetToken } from "@/lib/repositories/user.repository"
import { sendResetPasswordEmail } from "@/lib/email"

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret"

export async function POST(req: Request) {
  let email: string
  try {
    const body = await req.json()
    email = body.email
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
  }

  try {
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
    await sendResetPasswordEmail(email, user.name || "usuário", token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar email de recuperação:", error)
    return NextResponse.json({ success: true })
  }
}
