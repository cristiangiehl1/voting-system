import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"

const connectionString = process.env.DATABASE_URL!
const isNeon = connectionString.includes("neon.tech")

function createPrismaClient() {
  if (isNeon) {
    return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })
  }

  const pool = new Pool({ connectionString })
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

const prisma = createPrismaClient()

async function main() {
  console.log("🌱 Criando usuário de demonstração...")

  const demoPassword = await hash("demo123", 10)

  await prisma.user.upsert({
    where: { email: "demo@votinglists.app" },
    update: {},
    create: {
      email: "demo@votinglists.app",
      name: "Usuário Demo",
      passwordHash: demoPassword,
    },
  })

  console.log("✅ Seed concluído!")
  console.log("   Email: demo@votinglists.app")
  console.log("   Senha: demo123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
