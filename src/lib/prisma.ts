import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  console.log("[prisma] DATABASE_URL definida:", !!connectionString)

  if (!connectionString) {
    const error = new Error("DATABASE_URL não está definida nas environment variables!")
    console.error("[prisma] ERRO CRÍTICO:", error.message)
    throw error
  }

  const isNeon = connectionString.includes("neon.tech")
  console.log("[prisma] Detectado Neon:", isNeon)

  if (isNeon) {
    const adapter = new PrismaNeon({ connectionString })
    return new PrismaClient({ adapter })
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma
