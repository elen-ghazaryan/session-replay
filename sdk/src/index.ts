import { record } from 'rrweb';
import { Session } from './core/Session';
import { maskInput } from './core/privacy';
import { Batcher } from './core/Batcher';
import { HttpSender } from './transport/HttpSender';
import { TRACKING_ENDPOINT } from './config';
import { log, setLogLevel } from './logger';

export type TrackerOptions = {
  appId: string;
  debug?: boolean;
};

class TrackerClass {
  private session: Session | null = null;
  private batcher: Batcher | null = null;
  private sender: HttpSender | null = null;
  private stopRecording: (() => void) | null = null;
  private removeLifecycleListeners: (() => void) | null = null;

  init(options: TrackerOptions): void {
    if (this.session) {
      log.warn('already initialized');
      return;
    }

    const appId = options?.appId;
    if (typeof appId !== 'string' || appId.trim() === '') {
      throw new Error('[tracker] init() requires a non-empty appId');
    }

    const { debug = false } = options;
    setLogLevel(debug ? 'info' : 'warn');

    this.session = new Session(appId);
    const id = this.session.getOrCreate();
    log.info('session started:', id);

    this.sender = new HttpSender(TRACKING_ENDPOINT);
    this.batcher = new Batcher(this.session, this.sender.send, {
      onOverflow: () => record.takeFullSnapshot(),
    });

    this.stopRecording =
      record({
        emit: (event) => {
          this.session?.markActive();
          this.batcher?.push(event);
        },
        maskAllInputs: true,
        maskInputFn: maskInput,
        blockSelector: '[data-private]',
        sampling: {
          mousemove: 50,
          scroll: 150,
          input: 'last',
        },
      }) ?? null;

    const onTeardown = (e: Event) => {
      if (e.type === 'visibilitychange' && document.visibilityState !== 'hidden') return;
      this.drainAndBeacon();
    };
    document.addEventListener('visibilitychange', onTeardown);
    window.addEventListener('pagehide', onTeardown);
    this.removeLifecycleListeners = () => {
      document.removeEventListener('visibilitychange', onTeardown);
      window.removeEventListener('pagehide', onTeardown);
    };
  }

  stop(): void {
    if (!this.session) {
      log.warn('not running');
      return;
    }

    this.stopRecording?.();
    this.stopRecording = null;

    this.removeLifecycleListeners?.();
    this.removeLifecycleListeners = null;

    // Best-effort final ship via beacon — synchronous, reliable on stop.
    this.drainAndBeacon();

    this.session.destroy();
    this.batcher = null;
    this.sender = null;
    this.session = null;
    log.info('stopped');
  }

  private drainAndBeacon(): void {
    const payload = this.batcher?.drainForBeacon();
    if (!payload) return;
    const ok = this.sender?.sendBeacon(payload);
    if (ok === false) {
      log.warn(`sendBeacon refused ${payload.events.length} events (likely >64KB) — lost`);
    }
  }
}

export const Tracker = new TrackerClass();
