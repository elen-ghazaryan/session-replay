import type { Sender, TrackPayload } from '../core/Batcher';
import { toCreateTrackRequest } from './mapper';

export class HttpSender {
  constructor(private readonly endpoint: string) {}

  send: Sender = async (payload: TrackPayload): Promise<void> => {
    const body = JSON.stringify(toCreateTrackRequest(payload));

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`[tracker] backend ${response.status}`);
    }
  };

  sendBeacon(payload: TrackPayload): boolean {
    const body = JSON.stringify(toCreateTrackRequest(payload));
    const blob = new Blob([body], { type: 'application/json' });
    return navigator.sendBeacon(this.endpoint, blob);
  }
}
