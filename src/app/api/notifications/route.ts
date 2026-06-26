import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findNotificationsByUserId } from "@/lib/repositories/notification.repository"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json([])

    const notifications = await findNotificationsByUserId(session.user.id)
    return NextResponse.json(notifications)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
