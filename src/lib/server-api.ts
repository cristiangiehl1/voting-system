import { cookies } from "next/headers"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function serverFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies()

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    let message = "Erro do servidor"
    try {
      const body = await res.json()
      message = body.error || body.message || message
    } catch {}
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const serverApi = {
  getProfile: () => serverFetch<{ user: { id: string; name: string | null; email: string | null; imageUrl: string | null }; stats: { createdLists: number; participatingLists: number; votes: number } } | null>("/api/profile"),
  getList: (id: string) => serverFetch<any>(`/api/lists/${id}`),
  getMyListsPaginated: (cursor?: string) =>
    serverFetch<{ items: any[]; nextCursor: string | null }>(`/api/lists/paginated${cursor ? `?cursor=${cursor}` : ""}`),
  getPublicLists: () => serverFetch<any[]>("/api/lists/public"),
  getOptionsPaginated: (listId: string, cursor?: string) =>
    serverFetch<{ items: any[]; nextCursor: string | null }>(`/api/lists/${listId}/options/paginated${cursor ? `?cursor=${cursor}` : ""}`),
  getParticipants: (listId: string) => serverFetch<any[]>(`/api/lists/${listId}/participants`),
  getMyVotes: (listId: string) => serverFetch<any[]>(`/api/lists/${listId}/my-votes`),
  getMyInvites: () => serverFetch<any[]>("/api/invites"),
  getMyNotifications: () => serverFetch<any[]>("/api/notifications"),
  countUnreadNotifications: () => serverFetch<{ count: number }>("/api/notifications/unread/count"),
  getMyVotingHistory: () => serverFetch<any[]>("/api/voting-history"),
  getResults: (listId: string) => serverFetch<any[]>(`/api/lists/${listId}/results`),
  getPublicList: (id: string) => serverFetch<any>(`/api/share/${id}`),
  getPublicOptions: (listId: string) => serverFetch<any[]>(`/api/share/${listId}/options`),
  getPublicResults: (listId: string) => serverFetch<any[]>(`/api/share/${listId}/results`),
}
