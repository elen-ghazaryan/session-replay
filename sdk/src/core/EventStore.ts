import { type eventWithTime } from 'rrweb';
import { log } from '../logger';

export type StoredEvent = {
  id: string;
  event: eventWithTime;
  pageUrl: string;
};

const DB_NAME = 'tracker';
const STORE_NAME = 'pending-events';
const DB_VERSION = 1;

export class EventStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof indexedDB === 'undefined') {
      log.warn('IndexedDB unavailable - offline persistence disabled');
      return;
    }
    this.dbPromise = this.open();
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async add(events: StoredEvent[]): Promise<void> {
    await this.withStore('readwrite', (store) => {
      for (const e of events) store.put(e);
    });
  }

  async remove(ids: string[]): Promise<void> {
    await this.withStore('readwrite', (store) => {
      for (const id of ids) store.delete(id);
    });
  }

  async load(): Promise<StoredEvent[]> {
    if (!this.dbPromise) return [];
    try {
      const db = await this.dbPromise;
      return await new Promise<StoredEvent[]>((resolve, reject) => {
        const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result as StoredEvent[]);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      log.warn('failed to load persisted events', e);
      return [];
    }
  }

  async clear(): Promise<void> {
    await this.withStore('readwrite', (store) => store.clear());
  }

  private async withStore(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => void,
  ): Promise<void> {
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        fn(tx.objectStore(STORE_NAME));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      log.warn('IndexedDB write failed', e);
    }
  }
}
