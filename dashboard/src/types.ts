export interface SessionSummary {
  id: string
  appId: string
  startTime: string
  endTime: string | null
  eventCount: number
  userAgent: string | null
  screenResolution: string | null
  timezone: string | null
  deviceInfo: unknown | null
}

export interface SessionList {
  items: SessionSummary[]
  total: number
  limit: number
  offset: number
}

export interface EventDetail {
  id: number
  eventType: string // "click" | "scroll" | "mutation" | "snapshot"
  timestamp: string
  data: unknown
  pageUrl: string | null
}

export interface SessionDetail {
  session: SessionSummary
  events: EventDetail[]
}

export interface ApiError {
  code: string
  message: string
  fields?: Record<string, string> | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T | null
  error?: ApiError | null
}
