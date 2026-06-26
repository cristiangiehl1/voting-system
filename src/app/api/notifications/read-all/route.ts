import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markAllAsRead } from "@/lib/repositories/notification.repository"

export async function PUT() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  await markAllAsRead(session.user.id)
  return NextResponse.json({ success: true })
}
