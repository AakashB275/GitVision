export const API_BASE_URL: string =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:3000'

export interface ApiFetchOptions extends RequestInit {
  getToken: () => Promise<string | null>
}

/**
 * Thin wrapper around fetch that attaches the Clerk session token
 * and points at the backend's /api base.
 */
export async function apiFetch<T = unknown>(
  path: string,
  { getToken, headers, ...rest }: ApiFetchOptions,
): Promise<T> {
  const token = await getToken()

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }

  // Some endpoints (e.g. DELETE) may return an empty body
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}