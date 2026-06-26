class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {}

  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      const allCookies = cookieStore.getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ")
      if (allCookies) {
        headers["Cookie"] = allCookies
      }
    } catch {}
  }

  if (options?.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const mergedHeaders = { ...headers, ...options?.headers as Record<string, string> }
  const fetchOptions: RequestInit = { ...options }
  if (Object.keys(mergedHeaders).length > 0) {
    fetchOptions.headers = mergedHeaders
  }

  const res = await fetch(url, fetchOptions)

  if (!res.ok) {
    let message = "Erro do servidor"
    try {
      const body = await res.json()
      message = body.error || body.message || message
    } catch {}
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

function qs(obj: Record<string, string | undefined>): string {
  const entries = Object.entries(obj).filter(([, v]) => v != null)
  if (entries.length === 0) return ""
  return "?" + new URLSearchParams(entries as [string, string][]).toString()
}

export const api = {
  getMyLists: () => request<any[]>("/api/lists"),
  getMyListsPaginated: (cursor?: string) =>
    request<{ items: any[]; nextCursor: string | null }>(`/api/lists/paginated${qs({ cursor })}`),
  getPublicLists: () => request<any[]>("/api/lists/public"),
  getList: (id: string) => request<any | null>(`/api/lists/${id}`),
  createList: async (data: {
    name: string; description?: string; expiresAt?: string;
    revealVotes?: boolean; allowMultipleVotes?: boolean; rankedVoting?: boolean;
    maxRank?: number; allowParticipantsToAddOptions?: boolean; isPublic?: boolean;
    imageId?: string; imageUrl?: string;
  }) => {
    const res = await request<{ id: string }>("/api/lists", { method: "POST", body: JSON.stringify(data) })
    return res.id
  },
  updateList: (id: string, data: Record<string, any>) =>
    request(`/api/lists/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteList: (id: string) =>
    request(`/api/lists/${id}`, { method: "DELETE" }),
  updateListImage: (listId: string, imageId: string | null, imageUrl: string | null) =>
    request(`/api/lists/${listId}/image`, { method: "PUT", body: JSON.stringify({ imageId, imageUrl }) }),

  getOptions: (listId: string) => request<any[]>(`/api/lists/${listId}/options`),
  getOptionsPaginated: (listId: string, cursor?: string) =>
    request<{ items: any[]; nextCursor: string | null }>(`/api/lists/${listId}/options/paginated${qs({ cursor })}`),
  createOption: (listId: string, data: {
    name: string; description?: string; referenceUrl?: string;
    imageId?: string; imageUrl?: string;
  }) => request(`/api/lists/${listId}/options`, { method: "POST", body: JSON.stringify(data) }),
  updateOption: (optionId: string, data: Record<string, any>) =>
    request(`/api/options/${optionId}`, { method: "PUT", body: JSON.stringify(data) }),
  removeOption: (optionId: string) =>
    request(`/api/options/${optionId}`, { method: "DELETE" }),
  updateOptionImage: (optionId: string, imageId: string | null, imageUrl: string | null) =>
    request(`/api/options/${optionId}/image`, { method: "PUT", body: JSON.stringify({ imageId, imageUrl }) }),

  getParticipants: (listId: string) => request<any[]>(`/api/lists/${listId}/participants`),
  removeParticipant: (listId: string, participantId: string) =>
    request(`/api/lists/${listId}/participants/${participantId}`, { method: "DELETE" }),

  getInvites: (listId: string) => request<any[]>(`/api/lists/${listId}/invites`),
  inviteParticipant: (listId: string, email: string) =>
    request(`/api/lists/${listId}/invites`, { method: "POST", body: JSON.stringify({ email }) }),
  cancelInvite: (inviteId: string) =>
    request(`/api/invites/${inviteId}`, { method: "DELETE" }),
  getMyInvites: () => request<any[]>("/api/invites"),
  countMyPendingInvites: async () => {
    const res = await request<{ count: number }>("/api/invites/pending/count")
    return res.count
  },
  acceptInvite: (inviteId: string) =>
    request(`/api/invites/${inviteId}/accept`, { method: "POST" }),
  rejectInvite: (inviteId: string) =>
    request(`/api/invites/${inviteId}/reject`, { method: "POST" }),

  getMyVotes: (listId: string) => request<any[]>(`/api/lists/${listId}/my-votes`),
  vote: (optionId: string) =>
    request("/api/votes", { method: "POST", body: JSON.stringify({ optionId }) }),
  removeVote: (optionId: string) =>
    request("/api/votes", { method: "DELETE", body: JSON.stringify({ optionId }) }),
  submitRankedVotes: (listId: string, rankings: Array<{ optionId: string; rank: number }>) =>
    request(`/api/lists/${listId}/ranked-votes`, { method: "POST", body: JSON.stringify({ rankings }) }),

  getResults: (listId: string) => request<any[]>(`/api/lists/${listId}/results`),

  getMyNotifications: () => request<any[]>("/api/notifications"),
  countUnreadNotifications: async () => {
    const res = await request<{ count: number }>("/api/notifications/unread/count")
    return res.count
  },
  markNotificationAsRead: (id: string) =>
    request(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsAsRead: () =>
    request("/api/notifications/read-all", { method: "PUT" }),

  getMyVotingHistory: () => request<any[]>("/api/voting-history"),
  updateUserProfile: (data: { name?: string; imageId?: string | null; imageUrl?: string | null }) =>
    request("/api/profile", { method: "PUT", body: JSON.stringify(data) }),
  getProfile: () => request<{ user: { id: string; name: string | null; email: string | null; imageUrl: string | null }; stats: { createdLists: number; participatingLists: number; votes: number } } | null>("/api/profile"),

  registerUser: (name: string, email: string, password: string) =>
    request<{ error?: string; success?: boolean; email?: string }>("/api/auth/register", {
      method: "POST", body: JSON.stringify({ name, email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ error?: string; success?: boolean }>("/api/auth/forgot-password", {
      method: "POST", body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ error?: string; success?: boolean }>("/api/auth/reset-password", {
      method: "POST", body: JSON.stringify({ token, password }),
    }),

  getPublicList: (id: string) => request<any | null>(`/api/share/${id}`),
  getPublicOptions: (listId: string) => request<any[]>(`/api/share/${listId}/options`),
  getPublicResults: (listId: string) => request<any[]>(`/api/share/${listId}/results`),
}

export { ApiError }
