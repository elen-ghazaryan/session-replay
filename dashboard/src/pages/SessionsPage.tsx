import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SessionList, SessionSummary } from '../types'
import { formatDate, formatTime } from '../lib/format'
import { apiGet } from '../lib/api'

const LIMIT = 20; // page size
const ACTIVE_WINDOW_MS = 30 * 60 * 1000; // 30 min of inactivity → ended

// No explicit end signal exists, so "last activity" is the latest event time,
// falling back to start for sessions that never received a batch.
function lastActivity(s: SessionSummary): string {
  return s.endTime ?? s.startTime
}

function isActive(s: SessionSummary): boolean {
  return Date.now() - new Date(lastActivity(s)).getTime() <= ACTIVE_WINDOW_MS
}

export default function SessionsPage() {
    const navigate = useNavigate()
    const [items, setItems] = useState<SessionSummary[]>([])
    const [total, setTotal] = useState(0)
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false; // ignore a superseded request's response
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await apiGet<SessionList>(`/api/sessions?limit=${LIMIT}&offset=${offset}`)
                if (cancelled) return
                setItems(data?.items ?? [])
                setTotal(data?.total ?? 0)
            } catch (e) {
                if (cancelled) return
                setError(e instanceof Error ? e.message : 'Failed to load sessions')
                setItems([])
                setTotal(0)
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [offset, reloadKey]);

    function refresh() {
        setReloadKey((k) => k + 1)
    }

    const page = Math.floor(offset / LIMIT) + 1
    const pageCount = Math.max(1, Math.ceil(total / LIMIT))

    function prev() {
        setOffset(Math.max(0, offset - LIMIT))
    }
    function next() {
        if(offset + LIMIT < total) setOffset(offset + LIMIT)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 text-slate-900">
            <div className="w-full px-10 py-10">
                <header className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
                            Sessions
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {total} recorded {total === 1 ? 'session' : 'sessions'}
                        </p>
                    </div>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        title="Refresh"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                        >
                            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            <path d="M21 3v6h-6" />
                        </svg>
                        Refresh
                    </button>
                </header>

                <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-indigo-50/70 text-xs uppercase tracking-wider text-indigo-900/70">
                                <th className="px-5 py-3 text-left font-medium">Session</th>
                                <th className="px-5 py-3 text-left font-medium">Status</th>
                                <th className="px-5 py-3 text-left font-medium">Started</th>
                                <th className="px-5 py-3 text-left font-medium">Last activity</th>
                                <th className="px-5 py-3 text-left font-medium">Events</th>
                                <th className="px-5 py-3 text-left font-medium">Device</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((s) => {
                                const active = isActive(s)
                                const last = lastActivity(s)
                                return (
                                    <tr
                                        key={s.id}
                                        onClick={() => navigate(`/sessions/${s.id}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                navigate(`/sessions/${s.id}`)
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Open session ${s.id}`}
                                        className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50 focus:bg-slate-100 focus:outline-none"
                                    >
                                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-600">
                                            {s.id}
                                        </td>
                                        <td className="px-5 py-4">
                                            {active ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                    Ended
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-slate-900">{formatDate(s.startTime)}</div>
                                            <div className="text-xs text-slate-400">{formatTime(s.startTime)}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-slate-900">{formatDate(last)}</div>
                                            <div className="text-xs text-slate-400">{formatTime(last)}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                                {s.eventCount}
                                            </span>
                                        </td>
                                        <td className="max-w-xs truncate px-5 py-4 text-slate-500" title={s.userAgent ?? ''}>
                                            {s.userAgent ?? '—'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {loading && (
                        <p className="px-5 py-6 text-center text-sm text-slate-400">Loading…</p>
                    )}
                    {!loading && error && (
                        <p className="px-5 py-10 text-center text-sm text-red-600">{error}</p>
                    )}
                    {!loading && !error && items.length === 0 && (
                        <p className="px-5 py-10 text-center text-sm text-slate-400">No sessions yet.</p>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Page {page} of {pageCount}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={prev}
                            disabled={offset === 0 || loading}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <button
                            onClick={next}
                            disabled={offset + LIMIT >= total || loading}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
