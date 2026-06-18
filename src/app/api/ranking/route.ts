import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { name, description } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    if (!prisma.ranking) {
      console.error("prisma.ranking is undefined! Available keys:", Object.keys(prisma))
      return NextResponse.json({ error: "Prisma ranking model not available" }, { status: 500 })
    }

    const ranking = await prisma.ranking.create({
      data: {
        name,
        description: description || undefined,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ id: ranking.id })
  } catch (error) {
    console.error("Error creating ranking:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
