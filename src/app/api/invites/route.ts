import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findUserById } from "@/lib/repositories/user.repository"
import { findInvitesByEmail } from "@/lib/repositories/invite.repository"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([])

  const user = await findUserById(session.user.id)
  if (!user?.email) return NextResponse.json([])

  const invites = await findInvitesByEmail(user.email)
  return NextResponse.json(invites)
}
