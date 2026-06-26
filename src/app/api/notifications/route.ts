import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findNotificationsByUserId } from "@/lib/repositories/notification.repository"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([])

  const notifications = await findNotificationsByUserId(session.user.id)
  return NextResponse.json(notifications)
}
