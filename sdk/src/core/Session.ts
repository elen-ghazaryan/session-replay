const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const STORAGE_KEY = "tracker_session"

type StoredSession = {
  id: string
  startedAt: number
  lastActivity: number
}

export type SessionMetadata = {
  sessionId: string
  userAgent: string
  screenWidth: number
  screenHeight: number
  timezone: string
  startedAt: number
}


export class Session {
  private cached: StoredSession | null = null

  constructor() {
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return
      this.cached = null
    })
  }

  getOrCreate(): string {
    const candidate = this.cached ?? this.load()
    if (candidate && !this.isExpired(candidate)) {
      this.cached = candidate
      return candidate.id
    }

    const now = Date.now()
    const fresh: StoredSession = {
      id: crypto.randomUUID(),
      startedAt: now,
      lastActivity: now,
    }

    this.commit(fresh)
    return fresh.id
  }

  getMetadata(): SessionMetadata {
    if (!this.cached) {
      throw new Error("[tracker] getMetadata() called with no active session")
    }

    return {
      sessionId: this.cached.id,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startedAt: this.cached.startedAt
    }
  }

  touch(): void {
    if (!this.cached) {
      console.warn("[tracker] touch() called with no active session — skipping")
      return
    }
    const updated: StoredSession = {
      ...this.cached,
      lastActivity: Date.now()
    }
    this.commit(updated)
  }

  markActive(): void {
    this.getOrCreate()
    this.touch()
  }

  private load(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const parsed = JSON.parse(raw)
      if (
        typeof parsed?.id === "string" &&
        typeof parsed?.startedAt === "number" &&
        typeof parsed?.lastActivity === "number"
      ) {
        return parsed
      }
      return null
    } catch {
      return null
    }
  }

  private isExpired(session: StoredSession): boolean {
    return Date.now() - session.lastActivity > SESSION_TIMEOUT_MS
  }

  private commit(session: StoredSession): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch (e) {
      console.warn("[tracker] localStorage unavailable — session will not persist", e)
    }

    this.cached = session
  }
}