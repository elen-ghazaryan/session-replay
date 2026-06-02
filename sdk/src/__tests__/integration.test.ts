import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { record } from 'rrweb';
import { Tracker } from '../index';

vi.mock('rrweb', () => {
  const record: any = vi.fn();
  record.takeFullSnapshot = vi.fn();
  return {
    record,
    EventType: {
      0: 'DomContentLoaded',
      1: 'Load',
      2: 'FullSnapshot',
      3: 'IncrementalSnapshot',
      4: 'Meta',
      5: 'Custom',
      6: 'Plugin',
    },
  };
});

describe('Tracker (integration)', () => {
  let stopRecording: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal('navigator', { userAgent: 'UA', sendBeacon: vi.fn().mockReturnValue(true) });

    stopRecording = vi.fn();
    (record as any).mockReturnValue(stopRecording); // record() returns the stop fn
  });

  afterEach(() => {
    Tracker.stop(); // reset the singleton between tests
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Grab the emit callback Tracker handed to record(), so we can fire fake events.
  function emitEvent(e: unknown) {
    const cfg = (record as any).mock.calls.at(-1)[0];
    cfg.emit(e);
  }

  it('init starts a session and begins recording', () => {
    Tracker.init({ appId: 'app-1' });

    expect(record).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('tracker_session')).not.toBeNull();
  });

  it('init rejects an empty appId', () => {
    expect(() => Tracker.init({ appId: '' })).toThrow();
  });

  it('batches emitted events and POSTs them to the backend', async () => {
    Tracker.init({ appId: 'app-1' });

    for (let i = 0; i < 30; i++) emitEvent({ type: 3, data: {}, timestamp: i });
    await vi.advanceTimersByTimeAsync(0);

    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.session.appId).toBe('app-1');
    expect(body.events).toHaveLength(30);
  });

  it('stop ends recording and beacons leftover events', () => {
    Tracker.init({ appId: 'app-1' });
    emitEvent({ type: 3, data: {}, timestamp: 1 }); // 1 event, under batch → stays buffered

    Tracker.stop();

    expect(stopRecording).toHaveBeenCalledTimes(1); // recording torn down
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1); // leftover shipped via beacon
  });
});
