import { useState } from 'react';
import { DASHBOARD_URL, trackerStore, useTracker } from '../tracker';
import { Button } from './ui';

export function RecordingHud() {
  const { recording, sessionId, debug } = useTracker();
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full brand-gradient text-white shadow-lg shadow-indigo-500/30"
        title="Show recorder"
      >
        ●
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 w-72 rounded-2xl border border-slate-200 glass p-4 shadow-xl shadow-slate-900/10">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${recording ? 'rec-dot bg-rose-500' : 'bg-slate-300'}`}
          />
          <span className="text-sm font-bold text-slate-800">
            {recording ? 'Recording live' : 'Paused'}
          </span>
        </div>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>

      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Session ID</p>
      <p className="mb-3 truncate rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
        {sessionId ?? '—'}
      </p>

      <label className="mb-3 flex items-center justify-between text-sm text-slate-600">
        <span>Debug logs</span>
        <button
          onClick={() => trackerStore.setDebug(!debug)}
          disabled={recording}
          className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${debug ? 'bg-indigo-500' : 'bg-slate-300'}`}
          title={recording ? 'Stop recording to change' : ''}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${debug ? 'left-4' : 'left-0.5'}`}
          />
        </button>
      </label>

      <div className="flex gap-2">
        {recording ? (
          <Button variant="danger" size="sm" className="flex-1" onClick={() => trackerStore.stop()}>
            Stop
          </Button>
        ) : (
          <Button variant="success" size="sm" className="flex-1" onClick={() => trackerStore.start()}>
            Start
          </Button>
        )}
        <a
          href={sessionId ? `${DASHBOARD_URL}/sessions/${sessionId}` : DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="flex-1"
        >
          <Button variant="secondary" size="sm" className="w-full">
            View replay ↗
          </Button>
        </a>
      </div>
    </div>
  );
}
