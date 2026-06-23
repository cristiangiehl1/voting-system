"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  findListsByUserId,
  findListById,
  createList as createListRepository,
  updateList as updateListRepository,
  deleteList as deleteListRepository,
} from "@/lib/repositories/list.repository"
import {
  findOptionsByListId,
  findOptionById,
  createOption as createOptionRepository,
  deleteOption as deleteOptionRepository,
  updateOption as updateOptionRepository,
} from "@/lib/repositories/option.repository"
import {
  findParticipantsByListId,
  countParticipantsByUserAndList,
  upsertParticipant,
  deleteParticipant,
} from "@/lib/repositories/participant.repository"
import {
  findVotesByVoterAndList,
  deleteVotesByVoterAndOption,
  getResultsByListId,
} from "@/lib/repositories/vote.repository"
import { findUserByEmail, findUserById, updateUser as updateUserRepository } from "@/lib/repositories/user.repository"

export async function getMyLists() {
  const session = await auth()
  if (!session?.user?.id) return []

  return findListsByUserId(session.user.id)
}

export async function getList(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(id)
  if (!list) throw new Error("Lista não encontrada")

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, id)) > 0

  if (!isParticipant) throw new Error("Você não é participante desta lista")

  return list
}

export async function getOptions(listId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, listId)) > 0

  if (!isParticipant) throw new Error("Você não é participante desta lista")

  const options = await findOptionsByListId(listId, list.revealVotes)
  if (!list.revealVotes) {
    return options.map((o) => ({ ...o, votes: [] }))
  }
  return options
}

export async function getParticipants(listId: string) {
  return findParticipantsByListId(listId)
}

export async function getMyVotes(listId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return findVotesByVoterAndList(session.user.id, listId)
}

export async function getResults(listId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, listId)) > 0

  if (!isParticipant) throw new Error("Você não é participante desta lista")

  const results = await getResultsByListId(listId, list.rankedVoting, list.maxRank, list.revealVotes)
  if (!list.revealVotes) {
    return results.map((r) => ({ ...r, votes: [] }))
  }
  return results
}

export async function createList(
  name: string,
  description?: string,
  expiresAt?: string,
  revealVotes?: boolean,
  allowMultipleVotes?: boolean,
  rankedVoting?: boolean,
  maxRank?: number
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined
  if (parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
    throw new Error("Data de expiração inválida")
  }

  const isRanked = rankedVoting ?? false
  const list = await createListRepository({
    name,
    description: description || undefined,
    createdById: session.user.id,
    expiresAt: parsedExpiresAt,
    revealVotes,
    allowMultipleVotes: isRanked ? true : (allowMultipleVotes ?? false),
    rankedVoting: isRanked,
    maxRank,
  })

  revalidatePath("/")
  return list.id
}

export async function updateList(
  id: string,
  data: {
    name?: string
    description?: string
    imageId?: string
    imageUrl?: string
    expiresAt?: string | null
    revealVotes?: boolean
    allowMultipleVotes?: boolean
    rankedVoting?: boolean
    maxRank?: number
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(id)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode editar a lista")

  const parsedExpiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  if (data.expiresAt && parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
    throw new Error("Data de expiração inválida")
  }

  const isRanked = data.rankedVoting ?? false
  await updateListRepository(id, {
    name: data.name,
    description: data.description,
    imageId: data.imageId,
    imageUrl: data.imageUrl,
    expiresAt: parsedExpiresAt,
    revealVotes: data.revealVotes,
    allowMultipleVotes: isRanked ? true : data.allowMultipleVotes,
    rankedVoting: isRanked,
    maxRank: data.maxRank,
  })

  revalidatePath("/")
  revalidatePath(`/lists/${id}`)
  revalidatePath(`/lists/${id}/results`)
}

export async function createOption(
  name: string,
  listId: string,
  description?: string,
  imageId?: string,
  imageUrl?: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode adicionar opções")

  await createOptionRepository({
    name,
    description: description || undefined,
    imageId: imageId || undefined,
    imageUrl: imageUrl || undefined,
    listId,
  })

  revalidatePath(`/lists/${listId}`)
}

export async function addParticipant(listId: string, email: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode adicionar participantes")

  const user = await findUserByEmail(email)
  if (!user) throw new Error("Usuário não encontrado")
  if (user.id === session.user.id) throw new Error("O criador já é participante")

  await upsertParticipant(user.id, listId)

  revalidatePath(`/lists/${listId}`)
}

export async function removeParticipant(listId: string, participantId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode remover participantes")

  await deleteParticipant(participantId)

  revalidatePath(`/lists/${listId}`)
}

export async function updateOption(
  optionId: string,
  data: {
    name?: string
    description?: string
    imageId?: string
    imageUrl?: string
  }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const option = await findOptionById(optionId)
  if (!option) throw new Error("Opção não encontrada")
  if (option.list.createdById !== session.user.id) throw new Error("Apenas o criador pode editar opções")

  await updateOptionRepository(optionId, {
    name: data.name,
    description: data.description,
    imageId: data.imageId,
    imageUrl: data.imageUrl,
  })

  revalidatePath(`/lists/${option.list.id}`)
  revalidatePath(`/lists/${option.list.id}/results`)
}

export async function removeOption(optionId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const option = await findOptionById(optionId)
  if (!option) throw new Error("Opção não encontrada")
  if (option.list.createdById !== session.user.id) throw new Error("Apenas o criador pode remover opções")

  await deleteOptionRepository(optionId)

  revalidatePath(`/lists/${option.list.id}`)
}

export async function deleteList(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(id)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode deletar a lista")

  await deleteListRepository(id)

  revalidatePath("/")
}

export async function vote(optionId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const option = await findOptionById(optionId)
  if (!option) throw new Error("Opção não encontrada")

  const list = option.list
  if (list.expiresAt && new Date(list.expiresAt) < new Date()) {
    throw new Error("A votação desta lista expirou")
  }

  if (list.rankedVoting) {
    throw new Error("Esta lista usa votação por ranking. Use o formulário de ranking para votar.")
  }

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, list.id)) > 0

  if (!isParticipant) throw new Error("Você não é participante desta lista")

  await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({
      where: { voterId_optionId: { voterId: session.user.id, optionId } },
    })
    if (existing) throw new Error("Você já votou nesta opção")

    if (!list.allowMultipleVotes) {
      const votesInList = await tx.vote.count({
        where: { voterId: session.user.id, option: { listId: list.id } },
      })
      if (votesInList > 0) throw new Error("Esta lista permite apenas um voto por participante")
    }

    await tx.vote.create({
      data: { voterId: session.user.id, optionId },
    })
  })

  revalidatePath(`/lists/${list.id}`)
}

export async function removeVote(optionId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const option = await findOptionById(optionId)
  if (!option) throw new Error("Opção não encontrada")

  await deleteVotesByVoterAndOption(session.user.id, optionId)

  revalidatePath(`/lists/${option.list.id}`)
}

export async function submitRankedVotes(
  listId: string,
  rankings: Array<{ optionId: string; rank: number }>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")
  if (!list.rankedVoting) throw new Error("Esta lista não usa votação por ranking")
  if (list.expiresAt && new Date(list.expiresAt) < new Date()) {
    throw new Error("A votação desta lista expirou")
  }

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, list.id)) > 0

  if (!isParticipant) throw new Error("Você não é participante desta lista")

  if (rankings.length > list.maxRank) {
    throw new Error(`Máximo de ${list.maxRank} rankings permitidos`)
  }

  const rankSet = new Set<number>()
  for (const r of rankings) {
    if (r.rank < 1 || r.rank > (list.maxRank ?? 5)) {
      throw new Error(`Rank inválido: ${r.rank}`)
    }
    if (rankSet.has(r.rank)) {
      throw new Error(`Rank duplicado: ${r.rank}`)
    }
    rankSet.add(r.rank)
  }

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany({
      where: { voterId: session.user.id, option: { listId } },
    })

    for (const r of rankings) {
      await tx.vote.create({
        data: { voterId: session.user.id, optionId: r.optionId, rank: r.rank },
      })
    }
  })

  revalidatePath(`/lists/${listId}`)
  revalidatePath(`/lists/${listId}/results`)
}

export async function updateUserProfile(data: {
  name?: string
  imageId?: string | null
  imageUrl?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const user = await findUserById(session.user.id)
  if (!user) throw new Error("Usuário não encontrado")

  await updateUserRepository(session.user.id, {
    name: data.name,
    imageId: data.imageId !== undefined ? data.imageId : undefined,
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
  })

  revalidatePath("/profile")
}

export async function updateListImage(listId: string, imageId: string | null, imageUrl: string | null) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode editar a lista")

  await updateListRepository(listId, { imageId, imageUrl })

  revalidatePath(`/lists/${listId}`)
}

export async function updateOptionImage(
  optionId: string,
  imageId: string | null,
  imageUrl: string | null
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const option = await findOptionById(optionId)
  if (!option) throw new Error("Opção não encontrada")
  if (option.list.createdById !== session.user.id) throw new Error("Apenas o criador pode editar opções")

  await updateOptionRepository(optionId, {
    imageId: imageId ?? undefined,
    imageUrl: imageUrl ?? undefined,
  })

  revalidatePath(`/lists/${option.list.id}`)
  revalidatePath(`/lists/${option.list.id}/results`)
}
