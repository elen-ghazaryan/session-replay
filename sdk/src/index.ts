import { record } from "rrweb"
import { Session } from "./core/Session"
import { maskInput } from "./core/privacy"

class TrackerClass {
  private session: Session | null = null
  private stopRecording: (() => void) | null = null

  init(): void {
    if (this.session) {
      console.warn('[Tracker] already initialized')
      return
    }

    this.session = new Session()
    const id = this.session.getOrCreate()
    console.log('[Tracker] session started:', id)

    this.stopRecording = record({
      emit: (event) => {
        this.session?.markActive()

        // DEV-ONLY: cleaner console output. Remove when batcher takes over.
        if (event.type === 3) {
          const data = event.data as any
          if (data.source === 1 || data.source === 3) return // skip mouse-move + scroll
          if (data.source === 5) {
            console.log('[Tracker] input →', JSON.stringify(data.text))
            return
          }
          if (data.source === 2) {
            console.log('[Tracker] click/focus on node id', data.id)
            return
          }
        }
        console.log('[Tracker] event:', event)
      },
      maskAllInputs: true,
      maskInputFn: maskInput,
      blockSelector: '[data-private]',
    }) ?? null
  }

  stop(): void {
    if (!this.session) {
      console.warn('[Tracker] not running')
      return
    }
    this.stopRecording?.()
    this.stopRecording = null
    this.session = null
    console.log('[Tracker] stopped')
  }
}

export const Tracker = new TrackerClass()
