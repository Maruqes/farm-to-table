// Single place that talks to the API. Same-origin: the proxy routes /api to the api container.
const TOKEN_KEY = 'ftt.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore unavailable storage: requests still work without a token.
  }
}

// Fired when the server refuses the stored token (expired after 2h, or invalid).
export const SESSION_EXPIRED_EVENT = 'ftt:session-expired'

export function reportSessionExpired(): void {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export type ApiFields = Record<string, string>

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: ApiFields

  constructor(status: number, code: string, message: string, fields?: ApiFields) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

interface ErrorBody {
  error?: {
    code?: unknown
    message?: unknown
    fields?: unknown
  }
}

function fieldErrors(value: unknown): ApiFields | undefined {
  if (!value || typeof value !== 'object') return undefined
  const entries: [string, string][] = []
  for (const [key, message] of Object.entries(value)) {
    if (typeof message === 'string') entries.push([key, message])
  }
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function normaliseError(status: number, body: unknown): ApiError {
  const error = (body as ErrorBody | null)?.error
  const code = typeof error?.code === 'string' ? error.code : 'UNKNOWN_ERROR'
  const message =
    typeof error?.message === 'string' ? error.message : `Request failed with status ${status}`
  return new ApiError(status, code, message, fieldErrors(error?.fields))
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body != null && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json; charset=utf-8')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection and try again.',
    )
  }

  if (!response.ok) {
    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      // Keep the fallback error when the body is empty or not JSON.
    }
    const error = normaliseError(response.status, body)
    if (token && error.status === 401 && error.code === 'UNAUTHORIZED') reportSessionExpired()
    throw error
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
