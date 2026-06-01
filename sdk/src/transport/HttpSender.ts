import type { Sender, TrackPayload } from '../core/Batcher';
import { toCreateTrackRequest } from './mapper';
import { HttpError } from './HttpError';

export class HttpSender {
  constructor(private readonly endpoint: string) {}

  send: Sender = async (payload: TrackPayload): Promise<void> => {
    const body = JSON.stringify(toCreateTrackRequest(payload));

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      throw new HttpError(`[tracker] backend ${response.status}`, response.status);
    }
  };

  sendBeacon(payload: TrackPayload): boolean {
    const body = JSON.stringify(toCreateTrackRequest(payload));
    const blob = new Blob([body], { type: 'application/json' });
    return navigator.sendBeacon(this.endpoint, blob);
  }
}
