"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  findListsByUserId,
  findListById,
  findPublicLists,
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
  findParticipantByUserAndList,
  countParticipantsByUserAndList,
  upsertParticipant,
  deleteParticipant,
} from "@/lib/repositories/participant.repository"
import {
  findInvitesByEmail,
  findInvitesByListId,
  createInvite,
  updateInviteStatus,
  deleteInvite,
  countPendingInvitesByEmail,
} from "@/lib/repositories/invite.repository"
import {
  findVotesByVoterAndList,
  deleteVotesByVoterAndOption,
  getResultsByListId,
} from "@/lib/repositories/vote.repository"
import { findUserByEmail, findUserById, updateUser as updateUserRepository } from "@/lib/repositories/user.repository"
import {
  createNotification,
  createManyNotifications,
  findNotificationsByUserId,
  countUnreadByUserId,
  markAsRead,
  markAllAsRead,
} from "@/lib/repositories/notification.repository"

export async function getMyLists() {
  const session = await auth()
  if (!session?.user?.id) return []

  return findListsByUserId(session.user.id)
}

export async function getPublicLists() {
  return findPublicLists()
}

export async function getList(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(id)
  if (!list) throw new Error("Lista não encontrada")

  const isParticipant =
    list.createdById === session.user.id ||
    (await countParticipantsByUserAndList(session.user.id, id)) > 0

  if (!isParticipant && !list.isPublic) throw new Error("Você não é participante desta lista")

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

  if (!isParticipant && !list.isPublic) throw new Error("Você não é participante desta lista")

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

  if (!isParticipant && !list.isPublic) throw new Error("Você não é participante desta lista")

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
  maxRank?: number,
  allowParticipantsToAddOptions?: boolean,
  isPublic?: boolean
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
    allowParticipantsToAddOptions,
    isPublic,
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
    allowParticipantsToAddOptions?: boolean
    isPublic?: boolean
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
    allowParticipantsToAddOptions: data.allowParticipantsToAddOptions,
    isPublic: data.isPublic,
  })

  revalidatePath("/")
  revalidatePath(`/lists/${id}`)
  revalidatePath(`/lists/${id}/results`)
}

export async function createOption(
  name: string,
  listId: string,
  description?: string,
  referenceUrl?: string,
  imageId?: string,
  imageUrl?: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id && !list.allowParticipantsToAddOptions) {
    throw new Error("Apenas o criador pode adicionar opções")
  }

  await createOptionRepository({
    name,
    description: description || undefined,
    referenceUrl: referenceUrl || undefined,
    imageId: imageId || undefined,
    imageUrl: imageUrl || undefined,
    listId,
    createdById: session.user.id,
  })

  const participants = await findParticipantsByListId(listId)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "OPTION_ADDED" as const,
      title: `${session.user.name ?? session.user.email} adicionou "${name}" em "${list.name}"`,
      listId,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

  revalidatePath(`/lists/${listId}`)
}

export async function inviteParticipant(listId: string, email: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(listId)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode convidar participantes")

  if (email === session.user.email) throw new Error("Você não pode se convidar")

  const user = await findUserByEmail(email)
  if (user) {
    const participant = await findParticipantByUserAndList(user.id, listId)
    if (participant) throw new Error("Usuário já é participante desta lista")
  }

  const existingInvite = await prisma.invite.findUnique({
    where: { listId_email: { listId, email } },
  })
  if (existingInvite && existingInvite.status === "PENDING") {
    throw new Error("Já existe um convite pendente para este email")
  }

  await createInvite(listId, email)

  if (user) {
    await createNotification({
      userId: user.id,
      type: "INVITE_RECEIVED",
      title: `${session.user.name ?? session.user.email} te convidou para "${list.name}"`,
      listId,
    })
  }

  revalidatePath(`/lists/${listId}`)
}

export async function getInvites(listId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  return findInvitesByListId(listId)
}

export async function getMyInvites() {
  const session = await auth()
  if (!session?.user?.id) return []

  const user = await findUserById(session.user.id)
  if (!user?.email) return []

  return findInvitesByEmail(user.email)
}

export async function countMyPendingInvites() {
  const session = await auth()
  if (!session?.user?.id) return 0

  const user = await findUserById(session.user.id)
  if (!user?.email) return 0

  return countPendingInvitesByEmail(user.email)
}

export async function acceptInvite(inviteId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
  if (!invite) throw new Error("Convite não encontrado")
  if (invite.status !== "PENDING") throw new Error("Convite já foi respondido")

  const user = await findUserById(session.user.id)
  if (user?.email !== invite.email) throw new Error("Este convite não é para você")

  await prisma.$transaction([
    prisma.invite.update({ where: { id: inviteId }, data: { status: "ACCEPTED" } }),
    prisma.participant.upsert({
      where: { userId_listId: { userId: session.user.id, listId: invite.listId } },
      update: {},
      create: { userId: session.user.id, listId: invite.listId },
    }),
  ])

  const list = await findListById(invite.listId)
  if (list) {
    await createNotification({
      userId: list.createdById,
      type: "INVITE_ACCEPTED",
      title: `${user?.name ?? user?.email} aceitou seu convite para "${list.name}"`,
      listId: invite.listId,
    })
  }

  revalidatePath(`/lists/${invite.listId}`)
}

export async function rejectInvite(inviteId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
  if (!invite) throw new Error("Convite não encontrado")
  if (invite.status !== "PENDING") throw new Error("Convite já foi respondido")

  const user = await findUserById(session.user.id)
  if (user?.email !== invite.email) throw new Error("Este convite não é para você")

  await updateInviteStatus(inviteId, "REJECTED")

  const list = await findListById(invite.listId)
  if (list) {
    await createNotification({
      userId: list.createdById,
      type: "INVITE_REJECTED",
      title: `${user?.name ?? user?.email} recusou seu convite para "${list.name}"`,
      listId: invite.listId,
    })
  }

  revalidatePath(`/lists/${invite.listId}`)
}

export async function cancelInvite(inviteId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { list: true },
  })
  if (!invite) throw new Error("Convite não encontrado")
  if (invite.list.createdById !== session.user.id) throw new Error("Apenas o criador pode cancelar convites")

  await deleteInvite(inviteId)

  revalidatePath(`/lists/${invite.listId}`)
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
    referenceUrl?: string
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
    referenceUrl: data.referenceUrl,
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
  if (option.list.createdById !== session.user.id && !option.list.allowParticipantsToAddOptions) {
    throw new Error("Apenas o criador pode remover opções")
  }

  await deleteOptionRepository(optionId)

  const participants = await findParticipantsByListId(option.list.id)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "OPTION_REMOVED" as const,
      title: `${session.user.name ?? session.user.email} removeu "${option.name}" de "${option.list.name}"`,
      listId: option.list.id,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

  revalidatePath(`/lists/${option.list.id}`)
}

export async function deleteList(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const list = await findListById(id)
  if (!list) throw new Error("Lista não encontrada")
  if (list.createdById !== session.user.id) throw new Error("Apenas o criador pode deletar a lista")

  const participants = await findParticipantsByListId(id)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "LIST_DELETED" as const,
      title: `${session.user.name ?? session.user.email} encerrou a lista "${list.name}"`,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

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

  if (!isParticipant && !list.isPublic) throw new Error("Você não é participante desta lista")

  await prisma.$transaction(async (tx) => {
    if (!isParticipant && list.isPublic) {
      await tx.participant.upsert({
        where: { userId_listId: { userId: session.user.id, listId: list.id } },
        update: {},
        create: { userId: session.user.id, listId: list.id },
      })
    }

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

  const participants = await findParticipantsByListId(list.id)
  const notifications = participants
    .filter(p => p.userId !== session.user.id)
    .map(p => ({
      userId: p.userId,
      type: "NEW_VOTE" as const,
      title: `${session.user.name ?? session.user.email} votou em "${list.name}"`,
      listId: list.id,
    }))
  if (notifications.length > 0) {
    await createManyNotifications(notifications)
  }

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

  if (!isParticipant && !list.isPublic) throw new Error("Você não é participante desta lista")

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
    if (!isParticipant && list.isPublic) {
      await tx.participant.upsert({
        where: { userId_listId: { userId: session.user.id, listId } },
        update: {},
        create: { userId: session.user.id, listId },
      })
    }

      await tx.vote.deleteMany({
        where: { voterId: session.user.id, option: { listId } },
      })

      for (const r of rankings) {
        await tx.vote.create({
          data: { voterId: session.user.id, optionId: r.optionId, rank: r.rank },
        })
      }
    })

    const participants = await findParticipantsByListId(listId)
    const notifications = participants
      .filter(p => p.userId !== session.user.id)
      .map(p => ({
        userId: p.userId,
        type: "NEW_VOTE" as const,
        title: `${session.user.name ?? session.user.email} votou em "${list.name}"`,
        listId,
      }))
    if (notifications.length > 0) {
      await createManyNotifications(notifications)
    }

    revalidatePath(`/lists/${listId}`)
    revalidatePath(`/lists/${listId}/results`)
  }

export async function getMyNotifications() {
  const session = await auth()
  if (!session?.user?.id) return []

  return findNotificationsByUserId(session.user.id)
}

export async function countUnreadNotifications() {
  const session = await auth()
  if (!session?.user?.id) return 0

  return countUnreadByUserId(session.user.id)
}

export async function markNotificationAsRead(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  await markAsRead(id)
}

export async function markAllNotificationsAsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  await markAllAsRead(session.user.id)
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
