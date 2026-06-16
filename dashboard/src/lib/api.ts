import type { ApiResponse } from '../types'

const SERVER_UNAVAILABLE = 'Couldn’t reach the server. Check your connection and try again.'

// Fetch JSON and unwrap the ApiResponse envelope. Throws on transport
// or API errors; returns null when the call succeeds with no data.
export async function apiGet<T>(path: string): Promise<T | null> {
  let res: Response
  let json: ApiResponse<T>
  try {
    res = await fetch(path)
    json = await res.json()
  } catch {
    throw new Error(SERVER_UNAVAILABLE)
  }
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`)
  }
  return json.data ?? null
}

