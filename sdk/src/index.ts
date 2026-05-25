import { record } from 'rrweb';
import { Session } from './core/Session';
import { maskInput } from './core/privacy';

class TrackerClass {
  private session: Session | null = null;
  private stopRecording: (() => void) | null = null;

  init(): void {
    if (this.session) {
      console.warn('[Tracker] already initialized');
      return;
    }

    this.session = new Session();
    const id = this.session.getOrCreate();
    console.log('[Tracker] session started:', id);

    this.stopRecording =
      record({
        emit: (event) => {
          this.session?.markActive();
          // TODO: forward `event` to batcher when implemented
        },
        maskAllInputs: true,
        maskInputFn: maskInput,
        blockSelector: '[data-private]',
      }) ?? null;
  }

  stop(): void {
    if (!this.session) {
      console.warn('[Tracker] not running');
      return;
    }
    this.stopRecording?.();
    this.stopRecording = null;
    this.session = null;
    console.log('[Tracker] stopped');
  }
}

export const Tracker = new TrackerClass();
