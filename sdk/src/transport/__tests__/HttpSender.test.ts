import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpSender } from '../HttpSender';
import { HttpError } from '../HttpError';
import type { TrackPayload } from '../../core/Batcher';

const ENDPOINT = 'http://api.test/track';

// A minimal valid payload — one fake rrweb event (type 2 = FullSnapshot).
function payload(): TrackPayload {
  return {
    session: {
      sessionId: 's1',
      appId: 'app-1',
      userAgent: 'UA',
      screenWidth: 800,
      screenHeight: 600,
      timezone: 'UTC',
      startedAt: 0,
    },
    events: [
      { id: 'e1', event: { type: 2, data: {}, timestamp: 1000 } as any, pageUrl: 'http://x' },
    ],
  };
}

describe('HttpSender', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn()); // replace the real global fetch with fake one
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('POSTs the mapped payload to the endpoint', async () => {
    (fetch as any).mockResolvedValue({ ok: true }); // whenever called, returns Promise resolved to { ok: true }
    await new HttpSender(ENDPOINT).send(payload());

    const [url, opts] = (fetch as any).mock.calls[0]; // args of the 1st fetch call
    expect(url).toBe(ENDPOINT);
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');

    const sent = JSON.parse(opts.body); // proves the mapper ran
    expect(sent.session.id).toBe('s1');
    expect(sent.session.screenResolution).toBe('800x600');
    expect(sent.events[0].eventType).toBe('FullSnapshot');
  });

  it('resolves when the response is ok', async () => {
    (fetch as any).mockResolvedValue({ ok: true });
    await expect(new HttpSender(ENDPOINT).send(payload())).resolves.toBeUndefined();
  });

  it('throws HttpError carrying the status on a non-ok response', async () => {
    (fetch as any).mockResolvedValue({ ok: false, status: 500 });

    const err = await new HttpSender(ENDPOINT).send(payload()).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(500);
  });

  it('sendBeacon forwards endpoint + blob and returns its result', () => {
    const beacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { sendBeacon: beacon });

    const ok = new HttpSender(ENDPOINT).sendBeacon(payload());

    expect(ok).toBe(true);
    const [url, blob] = beacon.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(blob).toBeInstanceOf(Blob);
  });
});
