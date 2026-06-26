import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { findUserByEmail, updateUserResetToken } from "@/lib/repositories/user.repository"
import { sendResetPasswordEmail } from "@/lib/email"

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret"

export async function POST(req: Request) {
  console.log("[forgot-password] === NOVA REQUISIÇÃO ===")
  console.log("[forgot-password] AUTH_SECRET definido:", !!process.env.AUTH_SECRET)
  console.log("[forgot-password] DATABASE_URL definido:", !!process.env.DATABASE_URL)
  console.log("[forgot-password] EMAIL_SERVICE_BASE_URL:", process.env.EMAIL_SERVICE_BASE_URL || "NÃO DEFINIDO")
  console.log("[forgot-password] EMAIL_SERVICE_API_KEY definido:", !!process.env.EMAIL_SERVICE_API_KEY)
  console.log("[forgot-password] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "NÃO DEFINIDO")

  let email: string
  try {
    const body = await req.json()
    email = body.email
    console.log("[forgot-password] Email recebido:", email)
  } catch (error) {
    console.error("[forgot-password] Erro ao parsear body:", error)
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!email) {
    console.log("[forgot-password] Email vazio")
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
  }

  try {
    const user = await findUserByEmail(email)
    console.log("[forgot-password] Usuário encontrado:", !!user)
    console.log("[forgot-password] Email verificado:", user?.emailVerified)

    if (!user || !user.emailVerified) {
      console.log("[forgot-password] Usuário não encontrado ou email não verificado — retornando sucesso genérico")
      return NextResponse.json({ success: true })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    )
    console.log("[forgot-password] Token JWT gerado para userId:", user.id)

    await updateUserResetToken(user.id, token)
    console.log("[forgot-password] Reset token salvo no banco")

    console.log("[forgot-password] Tentando enviar email para:", email)
    await sendResetPasswordEmail(email, user.name || "usuário", token)
    console.log("[forgot-password] Email enviado com sucesso!")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[forgot-password] ERRO:", error?.message || error)
    console.error("[forgot-password] Stack:", error?.stack)
    return NextResponse.json(
      { error: "Erro interno do servidor. Verifique os logs da Vercel." },
      { status: 500 }
    )
  }
}
