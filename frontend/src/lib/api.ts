const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "")
const TOKEN_KEY = "interviewai.token"

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string }

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (!API_BASE) {
    throw new Error(
      "The API URL is not configured. Set VITE_API_BASE_URL and try again.",
    )
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
    signal,
  })

  let payload: ApiEnvelope<T>
  try {
    payload = await response.json()
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please try again.",
    )
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed (${response.status})`)
  }

  return (payload.data ?? payload) as T
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE) {
    throw new Error(
      "The API URL is not configured. Set VITE_API_BASE_URL and try again.",
    )
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed (${response.status})`)
  }
  return (payload.data ?? payload) as T
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function setApiToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getApiToken() {
  return localStorage.getItem(TOKEN_KEY)
}
