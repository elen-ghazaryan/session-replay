import { useSyncExternalStore } from 'react';
import { Tracker } from '../../sdk/src';

// Mirrors the SDK's localStorage session key so the UI can show the live id.
const SESSION_KEY = 'tracker_session';
const APP_ID = 'demo-site';

export type TrackerState = {
  recording: boolean;
  sessionId: string | null;
  debug: boolean;
};

let state: TrackerState = { recording: false, sessionId: null, debug: true };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readSessionId(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw).id ?? null) : null;
  } catch {
    return null;
  }
}

export const trackerStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot() {
    return state;
  },
  start() {
    if (state.recording) return;
    Tracker.init({ appId: APP_ID, debug: state.debug });
    state = { ...state, recording: true, sessionId: readSessionId() };
    emit();
  },
  stop() {
    if (!state.recording) return;
    Tracker.stop();
    state = { ...state, recording: false };
    emit();
  },
  setDebug(debug: boolean) {
    state = { ...state, debug };
    emit();
  },
};

export function useTracker(): TrackerState {
  return useSyncExternalStore(trackerStore.subscribe, trackerStore.getSnapshot);
}

export const DASHBOARD_URL = 'http://localhost:5173';
