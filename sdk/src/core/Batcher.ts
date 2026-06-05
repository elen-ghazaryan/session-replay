import { type eventWithTime } from 'rrweb';
import type { Session, SessionMetadata } from './Session';
import { isRetryable } from '../transport/HttpError';
import { log } from '../logger';

const BATCH_SIZE = 30;
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
  private inFlightSet: Set<BufferedEvent> = new Set();
  private failureMode: boolean = false;
  private retryDelay: number = INITIAL_RETRY_MS;

  // Source of truth for both push and flush: while true, no other send runs.
  private get sending(): boolean {
    return this.inFlightSet.size > 0;
  }

  constructor(
    private readonly session: Session,
    private readonly send: Sender,
    private readonly options: BatcherOptions = {},
  ) {}

  push(event: eventWithTime): void {
    this.buffer.push({ event, pageUrl: window.location.href });

    if (this.buffer.length > MAX_BUFFER_SIZE) {
      log.warn(
        `buffer overflow: backend unreachable, dropped ${this.buffer.length} events. ` +
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

    const inFlight = this.buffer.slice(0, BATCH_SIZE);
    let payload: TrackPayload;
    try {
      payload = { session: this.session.getMetadata(), events: inFlight };
    } catch (e) {
      log.warn('no active session, skipping flush', e);
      return;
    }
    // Track the exact events this send owns. Removal (and the beacon path)
    // key off identity, not position — so if the buffer is wiped and refilled
    // mid-send (overflow), we can't delete or double-ship the wrong events.
    const sent = new Set(inFlight);
    this.inFlightSet = sent;

    try {
      await this.send(payload);
      this.buffer = this.buffer.filter((e) => !sent.has(e)); // remove on success
      this.inFlightSet = new Set();
      this.onSendSuccess();
    } catch (e) {
      this.inFlightSet = new Set();
      if (isRetryable(e)) {
        log.warn('send failed, will retry', e);
        this.onSendFailure();
      } else {
        // 4xx: the payload is bad, retrying can't fix it. Drop the batch.
        log.error(`backend rejected batch, dropped ${sent.size} events`, e);
        this.buffer = this.buffer.filter((ev) => !sent.has(ev));
        this.onSendSuccess();
      }
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
    // Skip events the in-flight fetch already owns — keepalive will deliver
    // them, so beaconing them too would double-ship. Keep them in the buffer
    // so a cancelled unload can still resolve them normally.
    const events = this.buffer.filter((e) => !this.inFlightSet.has(e));
    if (events.length === 0) return null;

    let session: SessionMetadata;
    try {
      session = this.session.getMetadata();
    } catch (e) {
      log.warn('no active session, skipping beacon', e);
      return null;
    }

    this.buffer = this.buffer.filter((e) => this.inFlightSet.has(e));
    this.clearTimer();
    this.failureMode = false;
    this.retryDelay = INITIAL_RETRY_MS;
    return { session, events };
  }
}

/**
 * Batcher — buffers rrweb events and ships them in groups.
 *
 * Buffer is the source of truth: events stay until the backend confirms
 * delivery. Flush takes the first N events, sends them, and removes them
 * by identity on success — so failures or crashes mid-flight never lose
 * data, and a buffer wipe (overflow) mid-send can't delete the wrong events.
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
 * `drainForBeacon()` is the unload path: synchronously returns the buffered
 * events NOT already in flight, so the host can ship leftovers via
 * navigator.sendBeacon before the page dies without double-shipping.
 */
