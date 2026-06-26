import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteInvite } from "@/lib/repositories/invite.repository"

export async function DELETE(req: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { list: true },
  })
  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 })
  if (invite.list.createdById !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode cancelar convites" }, { status: 403 })
  }

  await deleteInvite(inviteId)
  return NextResponse.json({ success: true })
}
