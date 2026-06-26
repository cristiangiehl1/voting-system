import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markAsRead } from "@/lib/repositories/notification.repository"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  await markAsRead(id)
  return NextResponse.json({ success: true })
}
