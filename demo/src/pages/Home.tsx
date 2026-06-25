import { Link } from 'react-router-dom';
import { DASHBOARD_URL, useTracker } from '../tracker';
import { Badge, Button, Card } from '../components/ui';
import { Reveal } from '../components/Reveal';

const steps = [
  {
    n: '01',
    title: 'Interact with the pages',
    body: 'Click, type, scroll, open menus, add to cart. The SDK is already recording everything via rrweb.',
    icon: '🖱️',
  },
  {
    n: '02',
    title: 'See privacy in action',
    body: 'Sensitive fields are masked and data-private regions are skipped — the Forms page shows exactly what leaves the browser.',
    icon: '🛡️',
  },
  {
    n: '03',
    title: 'Replay in the dashboard',
    body: 'Open your session in the dashboard and watch a pixel-perfect replay of what you just did.',
    icon: '▶️',
  },
];

const captured = [
  { icon: '🖱️', label: 'Clicks & taps', desc: 'Every button, link and target.' },
  { icon: '⌨️', label: 'Text input', desc: 'Keystrokes — masked for privacy.' },
  { icon: '📜', label: 'Scroll & mouse', desc: 'Sampled movement and scroll.' },
  { icon: '🧩', label: 'DOM mutations', desc: 'Elements added, removed, changed.' },
  { icon: '🌐', label: 'Navigation', desc: 'Route changes across pages.' },
  { icon: '📐', label: 'Viewport', desc: 'Resize and screen metadata.' },
];

export function Home() {
  const { recording, sessionId } = useTracker();

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/60 px-8 py-16 text-center shadow-sm">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative animate-fade-up">
          <Badge tone={recording ? 'rose' : 'slate'}>
            <span className={`inline-block h-2 w-2 rounded-full ${recording ? 'rec-dot bg-rose-500' : 'bg-slate-400'}`} />
            {recording ? 'Recording this session now' : 'Recorder paused'}
          </Badge>

          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-900 sm:text-6xl">
            See your <span className="gradient-text">analytics SDK</span> work in real time
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
            A friendly playground for the Tracker SDK. Do normal things — the SDK quietly records
            them, and you replay the whole session in your dashboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/playground">
              <Button size="lg">Start exploring →</Button>
            </Link>
            <a
              href={sessionId ? `${DASHBOARD_URL}/sessions/${sessionId}` : DASHBOARD_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" variant="secondary">
                Open dashboard ↗
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">How this demo works</h2>
          <p className="mt-3 text-lg text-slate-500">Three steps, no setup.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <Card className="h-full hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">{s.icon}</span>
                  <span className="text-4xl font-black text-slate-100">{s.n}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What gets recorded */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">What the SDK captures</h2>
          <p className="mt-3 text-lg text-slate-500">
            Everything you need to reconstruct the session — nothing sensitive.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {captured.map((c, i) => (
            <Reveal key={c.label} delay={i * 80}>
              <Card className="flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{c.label}</h3>
                  <p className="text-sm text-slate-500">{c.desc}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <Reveal>
        <section className="overflow-hidden rounded-3xl brand-gradient-animated px-8 py-12 text-center text-white shadow-xl shadow-indigo-500/20">
          <h2 className="text-3xl font-bold">Ready? Go break things.</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Head to the playground and start clicking. Then open the dashboard to replay your every move.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/playground">
              <Button size="lg" variant="secondary" className="text-indigo-600!">
                Open the playground
              </Button>
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
