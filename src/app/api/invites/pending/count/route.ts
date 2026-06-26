import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findUserById } from "@/lib/repositories/user.repository"
import { countPendingInvitesByEmail } from "@/lib/repositories/invite.repository"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ count: 0 })

  const user = await findUserById(session.user.id)
  if (!user?.email) return NextResponse.json({ count: 0 })

  const count = await countPendingInvitesByEmail(user.email)
  return NextResponse.json({ count })
}
