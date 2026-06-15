import type { ApiResponse } from '../types'

// Fetch JSON and unwrap the ApiResponse envelope. Throws on transport
// or API errors; returns null when the call succeeds with no data.
export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await fetch(path)
  const json: ApiResponse<T> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`)
  }
  return json.data ?? null
}
