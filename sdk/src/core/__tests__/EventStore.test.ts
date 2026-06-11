import { type StoredEvent, EventStore } from '../EventStore';
import { describe, beforeEach, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

const ev = (id: string): StoredEvent => ({
  id,
  event: { type: 3, data: {}, timestamp: 0 } as any,
  pageUrl: 'http://x',
});

describe('EventStore', () => {
  let store: EventStore;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    store = new EventStore();
  });

  it('persists added events and loads them back', async () => {
    await store.add([ev('a'), ev('b')]);
    const loaded = await store.load();
    expect(loaded.map((e) => e.id).sort()).toEqual(['a', 'b']);
  });
  it('removes events by id', async () => {
    await store.add([ev('a'), ev('b')]);
    await store.remove(['a']);
    expect((await store.load()).map((e) => e.id)).toEqual(['b']);
  });

  it('clears the store', async () => {
    await store.add([ev('a'), ev('b')]);
    await store.clear();
    expect(await store.load()).toEqual([]);
  });

  it('re-adding the same id overwrites instead of duplicating', async () => {
    await store.add([ev('a')]);
    await store.add([ev('a')]);
    expect(await store.load()).toHaveLength(1);
  });

  describe('EventStore without IndexedDB', () => {
    it('no-ops safely when IndexedDB is unavailable', async () => {
      const original = globalThis.indexedDB;
      // @ts-expect-error simulate a browser with no IDB
      globalThis.indexedDB = undefined;

      const store = new EventStore();
      await expect(store.add([ev('a')])).resolves.toBeUndefined();
      await expect(store.remove(['a'])).resolves.toBeUndefined();
      await expect(store.clear()).resolves.toBeUndefined();
      expect(await store.load()).toEqual([]);

      globalThis.indexedDB = original;
    });
  });
});
