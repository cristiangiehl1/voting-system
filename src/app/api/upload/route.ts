import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { cloudinaryService } from "@/lib/cloudinary"
import { findListByImageId } from "@/lib/repositories/list.repository"
import { findOptionByImageId } from "@/lib/repositories/option.repository"
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

async function verifyImageOwnership(
  publicId: string,
  userId: string
): Promise<{ authorized: boolean; error?: string }> {
  const parts = publicId.split("/")

  if (parts[0] === "voting-system" && parts[1]) {
    const typeFolder = parts[1]

    if (typeFolder === "users") {
      const fileId = parts.slice(2).join("/")
      if (!fileId.startsWith(userId)) {
        return { authorized: false, error: "Você não pode modificar a imagem de outro usuário" }
      }
      return { authorized: true }
    }
    if (typeFolder === "lists") {
      const list = await findListByImageId(publicId)
      if (!list || list.createdById !== userId) {
        return { authorized: false, error: "Você não pode modificar a imagem desta lista" }
      }
      return { authorized: true }
    }
    if (typeFolder === "options") {
      const option = await findOptionByImageId(publicId)
      if (!option || option.list.createdById !== userId) {
        return { authorized: false, error: "Você não pode modificar a imagem desta opção" }
      }
      return { authorized: true }
    }
  }

  return { authorized: true }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = (formData.get("type") as string) ?? "option"
    const existingPublicId = formData.get("publicId") as string | null

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 })
    }

    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10)
    if (contentLength > MAX_FILE_SIZE || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo de 5MB." }, { status: 413 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Aceito: JPEG, PNG, GIF, WebP, AVIF." },
        { status: 415 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (existingPublicId) {
      const ownership = await verifyImageOwnership(existingPublicId, session.user.id)
      if (!ownership.authorized) {
        return NextResponse.json({ error: ownership.error }, { status: 403 })
      }
    }

    const folderMap: Record<string, string> = {
      user: "voting-system/users",
      list: "voting-system/lists",
      option: "voting-system/options",
    }

    const folder = folderMap[type] ?? "voting-system/options"

    const result = await cloudinaryService.uploadImage(buffer, {
      folder: existingPublicId ? undefined : folder,
      publicId: existingPublicId ?? `${session.user.id}_${Date.now()}`,
      invalidate: !!existingPublicId,
    })

    return NextResponse.json({
      publicId: result.publicId,
      url: result.url,
      secureUrl: result.secureUrl,
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { publicId } = await req.json()

    if (!publicId) {
      return NextResponse.json({ error: "publicId é obrigatório" }, { status: 400 })
    }

    const ownership = await verifyImageOwnership(publicId, session.user.id)
    if (!ownership.authorized) {
      return NextResponse.json({ error: ownership.error }, { status: 403 })
    }

    await cloudinaryService.deleteImage(publicId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Erro ao deletar imagem" }, { status: 500 })
  }
}
