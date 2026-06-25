import { useEffect, useState } from 'react';
import { Button, Card, Hint, SectionTitle } from '../components/ui';
import { Reveal } from '../components/Reveal';

export function Dynamic() {
  return (
    <div className="space-y-12">
      <SectionTitle
        eyebrow="Dynamic UI"
        title="The DOM keeps changing — replay keeps up"
        subtitle="rrweb records mutations, not screenshots. Add, remove, animate — the replay reconstructs every change."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal><TodoList /></Reveal>
        <Reveal delay={100}><LoadMore /></Reveal>
        <Reveal delay={150}><LiveClock /></Reveal>
        <Reveal delay={200}><ProgressCard /></Reveal>
      </div>
    </div>
  );
}

function TodoList() {
  const [items, setItems] = useState(['Try the playground', 'Submit the form']);
  const [text, setText] = useState('');
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Live list</h3>
      <Hint icon="➕">Adding and removing nodes is captured as DOM mutations.</Hint>
      <div className="mt-5 flex gap-2">
        <input
          data-allow
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              setItems((x) => [...x, text.trim()]);
              setText('');
            }
          }}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <Button
          size="sm"
          onClick={() => {
            if (!text.trim()) return;
            setItems((x) => [...x, text.trim()]);
            setText('');
          }}
        >
          Add
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((it, i) => (
          <li
            key={`${it}-${i}`}
            className="flex animate-fade-up items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {it}
            <button
              onClick={() => setItems((x) => x.filter((_, j) => j !== i))}
              className="text-slate-300 transition-colors hover:text-rose-500"
            >
              ✕
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="py-4 text-center text-sm text-slate-400">All done! 🎉</li>}
      </ul>
    </Card>
  );
}

function LoadMore() {
  const [count, setCount] = useState(3);
  const colors = ['bg-indigo-400', 'bg-violet-400', 'bg-fuchsia-400', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'];
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Load more</h3>
      <Hint icon="🔽">Each batch injects new cards — recorded as they appear.</Hint>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square animate-pop rounded-xl ${colors[i % colors.length]} opacity-80`}
          />
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4 w-full"
        onClick={() => setCount((c) => c + 3)}
      >
        Load more
      </Button>
    </Card>
  );
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Live clock</h3>
      <Hint icon="⏱️">Text that updates on its own — every tick is a recorded mutation.</Hint>
      <p className="mt-5 text-center font-mono text-4xl font-black gradient-text">{now}</p>
    </Card>
  );
}

function ProgressCard() {
  const [pct, setPct] = useState(40);
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Progress bar</h3>
      <Hint icon="📊">Style/attribute changes (the width) are captured too.</Hint>
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full brand-gradient transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button size="sm" variant="secondary" onClick={() => setPct((p) => Math.max(0, p - 20))}>
          −20%
        </Button>
        <span className="font-mono text-sm font-bold text-slate-700">{pct}%</span>
        <Button size="sm" variant="secondary" onClick={() => setPct((p) => Math.min(100, p + 20))}>
          +20%
        </Button>
      </div>
    </Card>
  );
}
