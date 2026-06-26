import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findListById } from "@/lib/repositories/list.repository"
import { deleteParticipant } from "@/lib/repositories/participant.repository"

export async function DELETE(req: Request, { params }: { params: Promise<{ listId: string; participantId: string }> }) {
  const { listId, participantId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const list = await findListById(listId)
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
  if (list.createdById !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode remover participantes" }, { status: 403 })
  }

  await deleteParticipant(participantId)
  return NextResponse.json({ success: true })
}
