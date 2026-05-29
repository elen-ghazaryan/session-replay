import { record } from 'rrweb';
import { Session } from './core/Session';
import { maskInput } from './core/privacy';
import { Batcher } from './core/Batcher';
import { HttpSender } from './transport/HttpSender';
import { TRACKING_ENDPOINT } from './config';

export type TrackerOptions = {
  appId: string;
};

class TrackerClass {
  private session: Session | null = null;
  private batcher: Batcher | null = null;
  private sender: HttpSender | null = null;
  private stopRecording: (() => void) | null = null;
  private unloadHandler: (() => void) | null = null;

  init(options: TrackerOptions): void {
    if (this.session) {
      console.warn('[Tracker] already initialized');
      return;
    }

    const appId = options?.appId;
    if (typeof appId !== 'string' || appId.trim() === '') {
      throw new Error('[Tracker] init() requires a non-empty appId');
    }

    this.session = new Session(appId);
    const id = this.session.getOrCreate();
    console.log('[Tracker] session started:', id);

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

    this.unloadHandler = () => {
      const payload = this.batcher?.drainForBeacon();
      if (payload) {
        this.sender?.sendBeacon(payload);
      }
    };
    window.addEventListener('beforeunload', this.unloadHandler);
  }

  stop(): void {
    if (!this.session) {
      console.warn('[Tracker] not running');
      return;
    }

    this.stopRecording?.();
    this.stopRecording = null;

    if (this.unloadHandler) {
      window.removeEventListener('beforeunload', this.unloadHandler);
      this.unloadHandler = null;
    }

    // Best-effort final ship via beacon — synchronous, reliable on stop.
    const payload = this.batcher?.drainForBeacon();
    if (payload) {
      this.sender?.sendBeacon(payload);
    }

    this.batcher = null;
    this.sender = null;
    this.session = null;
    console.log('[Tracker] stopped');
  }
}

export const Tracker = new TrackerClass();
