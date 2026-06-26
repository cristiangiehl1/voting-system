import { NextResponse } from "next/server"
import { findPublicLists } from "@/lib/repositories/list.repository"

export async function GET() {
  const lists = await findPublicLists()
  return NextResponse.json(lists)
}
