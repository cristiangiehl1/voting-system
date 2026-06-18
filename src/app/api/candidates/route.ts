import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchRandomMeme } from "@/lib/meme"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { name, email, rankingId } = await req.json()

    if (!name || !rankingId) {
      return NextResponse.json({ error: "Nome e ranking são obrigatórios" }, { status: 400 })
    }

    const avatar = await fetchRandomMeme()

    await prisma.candidate.create({
      data: { name, email: email || undefined, avatar, rankingId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating candidate:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
