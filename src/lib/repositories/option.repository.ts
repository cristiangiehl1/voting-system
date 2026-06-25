import { prisma } from "@/lib/prisma"

export async function findOptionsByListId(
  listId: string,
  includeVotes = false
): Promise<
  Array<{
    id: string
    name: string
    description: string | null
    referenceUrl: string | null
    imageId: string | null
    imageUrl: string | null
    createdAt: Date
    listId: string
    createdById: string
    createdBy: { id: string; name: string | null; imageUrl: string | null }
    _count: { votes: number }
      votes: Array<{
        id: string
        createdAt: Date
        voterId: string
        optionId: string
        voter: { id: string; name: string | null; email: string | null; imageUrl: string | null }
      }>
    }>
  > {
  return prisma.option.findMany({
    where: { listId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { votes: true } },
      createdBy: { select: { id: true, name: true, imageUrl: true } },
      ...(includeVotes
        ? {
            votes: {
              include: { voter: { select: { id: true, name: true, email: true, imageUrl: true } } },
              orderBy: { createdAt: "desc" },
            },
          }
        : {}),
    },
  }) as unknown as Promise<
    Array<{
      id: string
      name: string
      description: string | null
      referenceUrl: string | null
      imageId: string | null
      imageUrl: string | null
      createdAt: Date
      listId: string
      createdById: string
      createdBy: { id: string; name: string | null; imageUrl: string | null }
      _count: { votes: number }
      votes: Array<{
        id: string
        createdAt: Date
        voterId: string
        optionId: string
        voter: { id: string; name: string | null; email: string | null; imageUrl: string | null }
      }>
    }>
  >
}

type OptionWithVotes = NonNullable<Awaited<ReturnType<typeof findOptionsByListId>>>[number]

export async function findOptionsByListIdPaginated(
  listId: string,
  includeVotes: boolean,
  take: number,
  cursor?: string
): Promise<{ items: Array<OptionWithVotes>; nextCursor: string | null }> {
  const items = await prisma.option.findMany({
    where: { listId },
    orderBy: { name: "asc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      _count: { select: { votes: true } },
      createdBy: { select: { id: true, name: true, imageUrl: true } },
      ...(includeVotes
        ? {
            votes: {
              include: { voter: { select: { id: true, name: true, email: true, imageUrl: true } } },
              orderBy: { createdAt: "desc" },
            },
          }
        : {}),
    },
  }) as unknown as Array<OptionWithVotes>

  const nextCursor = items.length > take ? (items.pop()!.id) : null

  return { items, nextCursor }
}

export async function findOptionByImageId(imageId: string) {
  return prisma.option.findFirst({
    where: { imageId },
    include: { list: true },
  })
}

export async function findOptionById(id: string) {
  return prisma.option.findUnique({
    where: { id },
    include: { list: true },
  })
}

export async function createOption(data: {
  name: string
  description?: string
  referenceUrl?: string
  imageId?: string
  imageUrl?: string
  listId: string
  createdById: string
}) {
  return prisma.option.create({ data })
}

export async function updateOption(
  id: string,
  data: {
    name?: string
    description?: string
    referenceUrl?: string
    imageId?: string
    imageUrl?: string
  }
) {
  return prisma.option.update({ where: { id }, data })
}

export async function deleteOption(id: string) {
  return prisma.option.delete({ where: { id } })
}
