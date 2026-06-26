import { cookies } from "next/headers"

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

async function serverRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies()

  const headers: Record<string, string> = {}

  if (cookieStore.toString()) {
    headers["Cookie"] = cookieStore.toString()
  }

  if (options?.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(url, {
    headers: { ...headers, ...options?.headers as Record<string, string> },
    ...options,
  })

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

export const serverApi = {
  getProfile: () =>
    serverRequest<{ user: { id: string; name: string | null; email: string | null; imageUrl: string | null }; stats: { createdLists: number; participatingLists: number; votes: number } } | null>("/api/profile"),
}
