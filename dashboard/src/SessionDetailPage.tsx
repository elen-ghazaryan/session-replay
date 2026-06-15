import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ApiResponse, EventDetail, SessionDetail } from './types'
import { formatDateTime } from './format'

// rrweb IncrementalSource → friendly name (only IncrementalSnapshot carries source).
const INCREMENTAL_SOURCES: Record<number, string> = {
  0: 'Mutation',
  1: 'Mouse move',
  2: 'Click',
  3: 'Scroll',
  4: 'Resize',
  5: 'Input',
  6: 'Touch move',
  7: 'Media',
  9: 'Canvas',
  13: 'Style',
  14: 'Selection',
}

function eventLabel(e: EventDetail): string {
  if (e.eventType === 'IncrementalSnapshot') {
    const source = (e.data as { source?: number } | null)?.source
    if (source == null) return 'Incremental'
    return INCREMENTAL_SOURCES[source] ?? `Incremental (${source})`
  }
  return e.eventType
}

const TYPE_COLORS: Record<string, string> = {
  Click: 'bg-blue-50 text-blue-700',
  Scroll: 'bg-emerald-50 text-emerald-700',
  Mutation: 'bg-amber-50 text-amber-700',
  Input: 'bg-rose-50 text-rose-700',
  'Mouse move': 'bg-slate-100 text-slate-500',
  FullSnapshot: 'bg-violet-50 text-violet-700',
  Meta: 'bg-cyan-50 text-cyan-700',
}

function typeBadge(type: string): string {
  return TYPE_COLORS[type] ?? 'bg-slate-100 text-slate-600'
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/sessions/${id}`)
        const json: ApiResponse<SessionDetail> = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? `Request failed (${res.status})`)
        }
        setDetail(json.data ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load session')
        setDetail(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 text-slate-900">
      <div className="w-full px-10 py-10">
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          ← Back to sessions
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Session
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">{id}</p>
        </header>

        {loading && <p className="text-sm text-slate-400">Loading…</p>}

        {detail && (
          <>
            <dl className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <dt className="text-xs uppercase tracking-wider text-slate-400">Events</dt>
                <dd className="mt-1 text-2xl font-semibold">{detail.session.eventCount}</dd>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <dt className="text-xs uppercase tracking-wider text-slate-400">Started</dt>
                <dd className="mt-1 text-sm">{formatDateTime(detail.session.startTime)}</dd>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <dt className="text-xs uppercase tracking-wider text-slate-400">Last activity</dt>
                <dd className="mt-1 text-sm">
                  {formatDateTime(detail.session.endTime ?? detail.session.startTime)}
                </dd>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <dt className="text-xs uppercase tracking-wider text-slate-400">Timezone</dt>
                <dd className="mt-1 text-sm">{detail.session.timezone ?? '—'}</dd>
              </div>
            </dl>

            <h2 className="mb-3 text-lg font-semibold">Events ({detail.events.length})</h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50/70 text-xs uppercase tracking-wider text-indigo-900/70">
                    <th className="px-5 py-3 text-left font-medium">#</th>
                    <th className="px-5 py-3 text-left font-medium">Type</th>
                    <th className="px-5 py-3 text-left font-medium">Timestamp</th>
                    <th className="px-5 py-3 text-left font-medium">Page URL</th>
                    <th className="px-5 py-3 text-left font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.events.map((e, i) => (
                    <tr key={e.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${typeBadge(eventLabel(e))}`}>
                          {eventLabel(e)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {formatDateTime(e.timestamp)}
                      </td>
                      <td className="max-w-xs truncate px-5 py-3 text-slate-500" title={e.pageUrl ?? ''}>
                        {e.pageUrl ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <details>
                          <summary className="cursor-pointer text-xs text-indigo-600">view</summary>
                          <pre className="mt-2 max-w-md overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                            {JSON.stringify(e.data, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && !detail && (
          <p className="text-sm text-slate-400">Session not found.</p>
        )}
      </div>
    </div>
  )
}
