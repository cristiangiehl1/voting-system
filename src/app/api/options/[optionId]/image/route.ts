import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findOptionById, updateOption as updateOptionRepository } from "@/lib/repositories/option.repository"

export async function PUT(req: Request, { params }: { params: Promise<{ optionId: string }> }) {
  const { optionId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const option = await findOptionById(optionId)
  if (!option) return NextResponse.json({ error: "Opção não encontrada" }, { status: 404 })
  if (option.list.createdById !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode editar opções" }, { status: 403 })
  }

  const { imageId, imageUrl } = await req.json()
  await updateOptionRepository(optionId, {
    imageId: imageId ?? undefined,
    imageUrl: imageUrl ?? undefined,
  })

  return NextResponse.json({ success: true })
}
