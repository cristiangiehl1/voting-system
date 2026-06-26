import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { countUnreadByUserId } from "@/lib/repositories/notification.repository"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ count: 0 })

    const count = await countUnreadByUserId(session.user.id)
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
