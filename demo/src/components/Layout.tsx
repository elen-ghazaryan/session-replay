import { NavLink, Outlet } from 'react-router-dom';
import { useTracker } from '../tracker';
import { RecordingHud } from './RecordingHud';
import { Toaster } from './toast';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/playground', label: 'Playground' },
  { to: '/forms', label: 'Forms & Privacy' },
  { to: '/dynamic', label: 'Dynamic UI' },
  { to: '/shop', label: 'Shop Journey' },
];

export function Layout() {
  const { recording } = useTracker();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 glass">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-sm font-black text-white">
              T
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">Tracker</span>
            <span className="hidden text-sm font-medium text-slate-400 sm:inline">SDK Demo</span>
          </NavLink>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold">
            <span
              className={`inline-block h-2 w-2 rounded-full ${recording ? 'rec-dot bg-rose-500' : 'bg-slate-300'}`}
            />
            <span className={recording ? 'text-rose-600' : 'text-slate-500'}>
              {recording ? 'REC' : 'OFF'}
            </span>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/60 py-8 text-center text-sm text-slate-400">
        Every interaction here is captured by the Tracker SDK and replayable in your dashboard.
      </footer>

      <RecordingHud />
      <Toaster />
    </div>
  );
}
