import { NextResponse } from "next/server"
import { findListById } from "@/lib/repositories/list.repository"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = await findListById(id)
  if (!list || !list.isPublic) return NextResponse.json(null)
  return NextResponse.json(list)
}
