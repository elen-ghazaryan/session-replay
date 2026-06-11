import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Batcher } from '../Batcher';
import { HttpError } from '../../transport/HttpError';

describe('Batcher', () => {
  let send: ReturnType<typeof vi.fn>;
  let onOverflow: ReturnType<typeof vi.fn>;
  let batcher: Batcher;

  // Fake Session — only getMetadata() is used by Batcher.
  const session = {
    getMetadata: () => ({
      sessionId: 's1',
      appId: 'app-1',
      userAgent: 'UA',
      screenWidth: 0,
      screenHeight: 0,
      timezone: 'UTC',
      startedAt: 0,
    }),
  };

  // Push n fake rrweb events into the buffer.
  function pushN(n: number) {
    for (let i = 0; i < n; i++) {
      batcher.push({ type: 3, data: {}, timestamp: i } as any);
    }
  }

  let store: { load: any; add: any; remove: any; clear: any };

  beforeEach(() => {
    vi.useFakeTimers();
    send = vi.fn().mockResolvedValue(undefined); // default: every send succeeds
    onOverflow = vi.fn();
    store = {
      load: vi.fn().mockResolvedValue([]), // recovery() calls this on construct
      add: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    batcher = new Batcher(session as any, send as any, store as any, {
      onOverflow: onOverflow as any,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushes once the buffer reaches batch size (30)', async () => {
    pushN(30);
    await vi.advanceTimersByTimeAsync(0); // let the async flush settle

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].events).toHaveLength(30);
  });

  it('flushes after the 5s interval when under batch size', async () => {
    pushN(5);
    expect(send).not.toHaveBeenCalled(); // nothing yet — timer hasn't fired

    await vi.advanceTimersByTimeAsync(5000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].events).toHaveLength(5);
  });

  it('does not start a second send while one is in flight', async () => {
    let resolveSend!: () => void;
    // First send hangs until we resolve it manually.
    send.mockReturnValueOnce(new Promise<void>((r) => (resolveSend = r)));

    pushN(30); // triggers send #1 (now pending)
    pushN(30); // would flush, but a send is in flight → skipped
    expect(send).toHaveBeenCalledTimes(1);

    resolveSend();
    await vi.advanceTimersByTimeAsync(0);
  });

  it('removes sent events from the buffer on success', async () => {
    pushN(30);
    await vi.advanceTimersByTimeAsync(0);

    // Buffer drained → nothing left for a beacon to grab.
    expect(batcher.drainForBeacon()).toBeNull();
  });

  it('retries with backoff after a retryable failure', async () => {
    send
      .mockRejectedValueOnce(new Error('network')) // retryable (not an HttpError)
      .mockResolvedValueOnce(undefined);

    pushN(30);
    await vi.advanceTimersByTimeAsync(0); // send #1 rejects → failure mode, retry scheduled @1000ms
    expect(send).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000); // retry timer fires
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('drops the batch on a 4xx without retrying', async () => {
    send.mockRejectedValueOnce(new HttpError('bad', 400));

    pushN(30);
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60000); // give any retry plenty of time
    expect(send).toHaveBeenCalledTimes(1); // never retried
    expect(batcher.drainForBeacon()).toBeNull(); // batch was dropped
  });

  it('drops the buffer and fires onOverflow past the cap (1000)', () => {
    // send #1 (at 30) stays pending because we never settle microtasks here,
    // so `sending` stays true and the buffer keeps growing to overflow.
    pushN(1001);
    expect(onOverflow).toHaveBeenCalledTimes(1);
  });

  it('drainForBeacon returns buffered events then empties', () => {
    pushN(5);
    expect(batcher.drainForBeacon()?.events).toHaveLength(5);
    expect(batcher.drainForBeacon()).toBeNull(); // already drained
  });

  it('recovers persisted events on startup and flushes them', async () => {
    const persisted = [
      { id: 'r1', event: { type: 3, data: {}, timestamp: 1 } as any, pageUrl: 'http://x' },
      { id: 'r2', event: { type: 3, data: {}, timestamp: 2 } as any, pageUrl: 'http://x' },
    ];
    store.load.mockResolvedValueOnce(persisted);

    // New batcher so recovery() runs against the loaded events.
    new Batcher(session as any, send as any, store as any, { onOverflow: onOverflow as any });
    await vi.advanceTimersByTimeAsync(0); // let recovery's load + flush settle

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].events.map((e: any) => e.id)).toEqual(['r1', 'r2']);
  });
});
