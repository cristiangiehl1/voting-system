import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findListById, updateList as updateListRepository } from "@/lib/repositories/list.repository"

export async function PUT(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  const { listId: id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(id)
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
  if (list.createdById !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode editar a lista" }, { status: 403 })
  }

  const { imageId, imageUrl } = await req.json()
  await updateListRepository(id, { imageId, imageUrl })
  return NextResponse.json({ success: true })
}
