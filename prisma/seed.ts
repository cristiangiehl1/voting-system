import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Populando labels de inconveniência...")

  const labels = [
    { name: "Reclama de problemas inexistentes", icon: "🔍", color: "#ef4444" },
    { name: "O problema desaparece quando vou na máquina", icon: "👻", color: "#8b5cf6" },
    { name: "Não sabe descrever o problema", icon: "🤷", color: "#f59e0b" },
    { name: "Liga 5x no mesmo dia", icon: "📞", color: "#ec4899" },
    { name: "Problema é sempre 'urgente'", icon: "🔥", color: "#ef4444" },
    { name: "Print da tela? O que é isso?", icon: "📸", color: "#6366f1" },
    { name: "Senha errada 10x seguidas", icon: "🔑", color: "#14b8a6" },
    { name: "O problema é sempre 'o sistema'", icon: "💻", color: "#3b82f6" },
    { name: "Manda e-mail às 23h", icon: "🌙", color: "#8b5cf6" },
    { name: "Meu primo que entende de TI disse", icon: "👨‍💻", color: "#f97316" },
    { name: "Anexa foto da tela com o celular", icon: "📱", color: "#06b6d4" },
    { name: "'Tá tudo lento' - só o PC dele", icon: "🐢", color: "#84cc16" },
    { name: "Ignorou o e-mail com instruções", icon: "📧", color: "#e11d48" },
    { name: "Pediu para resetar a senha de novo", icon: "🔄", color: "#d946ef" },
    { name: "O problema é 'de sempre'", icon: "♻️", color: "#64748b" },
  ]

  for (const label of labels) {
    await prisma.label.upsert({
      where: { name: label.name },
      update: {},
      create: label,
    })
  }

  console.log("🏆 Populando conquistas...")

  const achievements = [
    { key: "first_vote", name: "Primeiro Voto", description: "Registre seu primeiro voto", icon: "🎯", category: "voting", threshold: 1 },
    { key: "voting_addict", name: "Viciado em Votar", description: "Acumule 100 votos", icon: "💉", category: "voting", threshold: 100 },
    { key: "super_voter", name: "Super Eleitor", description: "Acumule 500 votos", icon: "⚡", category: "voting", threshold: 500 },
    { key: "critic", name: "Crítico de TI", description: "Deixe 50 comentários", icon: "📝", category: "comments", threshold: 50 },
    { key: "label_hunter", name: "Label Hunter", description: "Use todos os 15 labels de inconveniência", icon: "🏷️", category: "labels", threshold: 15 },
    { key: "night_owl", name: "Corujão do Suporte", description: "Vote entre 22h e 6h", icon: "🦉", category: "special" },
    { key: "streak_3", name: "Determinado", description: "Vote 3 dias seguidos", icon: "🔥", category: "streak", threshold: 3 },
    { key: "streak_7", name: "Persistente", description: "Vote 7 dias seguidos", icon: "🔥", category: "streak", threshold: 7 },
    { key: "streak_30", name: "Lendário", description: "Vote 30 dias seguidos", icon: "💎", category: "streak", threshold: 30 },
    { key: "ranking_explorer", name: "Explorador", description: "Vote em todos os rankings existentes", icon: "🌍", category: "special" },
    { key: "early_adopter", name: "Pioneiro", description: "Seja a primeira pessoa a votar em alguém", icon: "🥇", category: "special" },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: {},
      create: ach,
    })
  }

  console.log("✅ Seed concluído!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
