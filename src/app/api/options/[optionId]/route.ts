import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findOptionById, updateOption as updateOptionRepository, deleteOption as deleteOptionRepository } from "@/lib/repositories/option.repository"
import { findParticipantsByListId } from "@/lib/repositories/participant.repository"
import { createManyNotifications } from "@/lib/repositories/notification.repository"

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

  const body = await req.json()
  await updateOptionRepository(optionId, {
    name: body.name,
    description: body.description,
    referenceUrl: body.referenceUrl,
    imageId: body.imageId,
    imageUrl: body.imageUrl,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ optionId: string }> }) {
  const { optionId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const option = await findOptionById(optionId)
  if (!option) return NextResponse.json({ error: "Opção não encontrada" }, { status: 404 })
  if (option.list.createdById !== session.user.id && !option.list.allowParticipantsToAddOptions) {
    return NextResponse.json({ error: "Apenas o criador pode remover opções" }, { status: 403 })
  }

  await deleteOptionRepository(optionId)

  const participants = await findParticipantsByListId(option.list.id)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "OPTION_REMOVED" as const,
      title: `${session.user.name ?? session.user.email} removeu "${option.name}" de "${option.list.name}"`,
      listId: option.list.id,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

  return NextResponse.json({ success: true })
}
