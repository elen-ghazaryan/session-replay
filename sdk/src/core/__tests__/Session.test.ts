import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Session } from '../Session';

const STORAGE_KEY = 'tracker_session';

describe('Session', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates a fresh session and persists it', () => {
    const s = new Session('app-1');
    const id = s.getOrCreate();

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('reuses the same session on repeated calls', () => {
    const s = new Session('app-1');
    expect(s.getOrCreate()).toBe(s.getOrCreate());
  });

  it('loads an existing session from storge into a new instance', () => {
    const id = new Session('app-1').getOrCreate();
    const id2 = new Session('app-1').getOrCreate(); // fresh instance, reads storage
    expect(id2).toBe(id);
  });

  it('starts a new session once the old one expires', () => {
    const s = new Session('app-1');
    const first = s.getOrCreate();

    vi.setSystemTime(new Date('2026-01-01T00:31:00Z')); // timeout
    const second = s.getOrCreate();

    expect(second).not.toBe(first);
  });

  it('ignores malformed storage and creates fresh', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{');
    const id = new Session('app-1').getOrCreate(); // must not throw
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('getMetadata throws when there is no active session', () => {
    const s = new Session('app-1');
    expect(() => s.getMetadata()).toThrow();
  });

  it('getMetadata returns the appId and session id after start', () => {
    const s = new Session('app-1');
    const id = s.getOrCreate();
    const meta = s.getMetadata();

    expect(meta.sessionId).toBe(id);
    expect(meta.appId).toBe('app-1');
  });

  it('keeps working in memory when localStorage write fails', () => {
    const s = new Session('app-1');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    const id = s.getOrCreate(); // commit() swallows the throw
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(s.getMetadata().sessionId).toBe(id); // in-memory cache still set
  });

  it('drops its cache when another tab changes storage', () => {
    const s = new Session('app-1');
    const first = s.getOrCreate();

    // Another tab writes a different session, then the browser fires 'storage'.
    const other = { id: 'other-id', startedAt: Date.now(), lastActivity: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(other));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    // Cache was cleared → next call reloads from storage and sees the new id.
    expect(s.getOrCreate()).toBe('other-id');
    expect(s.getOrCreate()).not.toBe(first);
  });
});
