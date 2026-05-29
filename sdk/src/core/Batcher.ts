import { type eventWithTime } from 'rrweb';
import type { Session, SessionMetadata } from './Session';

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 1000;
const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

type BufferedEvent = {
  event: eventWithTime;
  pageUrl: string;
};

export type TrackPayload = {
  session: SessionMetadata;
  events: BufferedEvent[];
};

export type Sender = (payload: TrackPayload) => Promise<void>;

export type BatcherOptions = {
  onOverflow?: () => void;
};

export class Batcher {
  private buffer: BufferedEvent[] = [];
  private timer: number | null = null;
  private sending: boolean = false;
  private failureMode: boolean = false;
  private retryDelay: number = INITIAL_RETRY_MS;

  constructor(
    private readonly session: Session,
    private readonly send: Sender,
    private readonly options: BatcherOptions = {},
  ) {}

  push(event: eventWithTime): void {
    this.buffer.push({ event, pageUrl: window.location.href });

    if (this.buffer.length > MAX_BUFFER_SIZE) {
      console.warn(
        `[tracker] buffer overflow: backend unreachable, dropped ${this.buffer.length} events. ` +
          `Taking new FullSnapshot for clean replay restart.`,
      );
      this.buffer = [];
      this.options.onOverflow?.();
      return;
    }

    if (this.failureMode || this.sending) return;

    if (this.buffer.length >= BATCH_SIZE) {
      void this.flush();
      return;
    }

    if (this.timer === null) {
      this.scheduleTimer(FLUSH_INTERVAL_MS);
    }
  }

  async flush(): Promise<void> {
    if (this.sending || this.buffer.length === 0) return;

    this.clearTimer();
    this.sending = true;

    const inFlight = this.buffer.slice(0, BATCH_SIZE);
    const payload = {
      session: this.session.getMetadata(),
      events: inFlight,
    };

    try {
      await this.send(payload);
      this.buffer.splice(0, inFlight.length); //remove on success
      this.onSendSuccess();
    } catch (e) {
      console.warn('[tracker] send failed, will retry', e);
      this.onSendFailure();
    } finally {
      this.sending = false;
    }
  }

  private onSendSuccess(): void {
    this.failureMode = false;
    this.retryDelay = INITIAL_RETRY_MS;

    // If more events arrived during the send, schedule a follow-up.
    if (this.buffer.length >= BATCH_SIZE) {
      this.scheduleTimer(0); // drain immediately
    } else if (this.buffer.length > 0) {
      this.scheduleTimer(FLUSH_INTERVAL_MS);
    }
  }

  private onSendFailure(): void {
    this.failureMode = true;
    this.scheduleTimer(this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_MS);
  }

  private scheduleTimer(delayMs: number): void {
    this.clearTimer();
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delayMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  drainForBeacon(): TrackPayload | null {
    if (this.buffer.length === 0) return null;

    const events = this.buffer;
    this.buffer = [];
    this.clearTimer();
    return { session: this.session.getMetadata(), events };
  }
}

/**
 * Batcher — buffers rrweb events and ships them in groups.
 *
 * Buffer is the source of truth: events stay until the backend confirms
 * delivery. Flush peeks the first N events, sends them, and only removes
 * them on success — so failures or crashes mid-flight never lose data.
 *
 * On send failure we enter a failure mode and retry with exponential
 * backoff (capped). While in failure mode, new events keep accumulating
 * but do NOT trigger size-based flushes; only the backoff timer fires.
 * First success exits failure mode.
 *
 * If the buffer exceeds the cap (sustained outage), we drop it and fire
 * `onOverflow` — the host responds by requesting a new rrweb FullSnapshot
 * so replay continues from a fresh anchor instead of desyncing.
 *
 * `drainForBeacon()` is the unload path: returns the full buffer
 * synchronously so the host can ship leftovers via navigator.sendBeacon
 * before the page dies.
 */
