import { useState } from 'react';
import { Badge, Button, Card, Hint, SectionTitle } from '../components/ui';
import { Reveal } from '../components/Reveal';

export function Playground() {
  return (
    <div className="space-y-12">
      <SectionTitle
        eyebrow="Playground"
        title="Click around — it's all recorded"
        subtitle="Standard UI controls you'd find in any app — every interaction is captured for replay."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Reveal><ClickCounter /></Reveal>
        <Reveal delay={80}><ToggleCard /></Reveal>
        <Reveal delay={120}><TabsCard /></Reveal>
        <Reveal delay={160}><AccordionCard /></Reveal>
        <Reveal delay={200}><DropdownCard /></Reveal>
        <Reveal delay={240}><LikeCard /></Reveal>
      </div>

      <Reveal>
        <ModalCard />
      </Reveal>
    </div>
  );
}

function ClickCounter() {
  const [count, setCount] = useState(0);
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Click counter</h3>
      <Hint>Every press is recorded as a click event on this exact button.</Hint>
      <div className="mt-5 flex items-center gap-4">
        <Button onClick={() => setCount((c) => c + 1)}>
          +1
        </Button>
        <span key={count} className="animate-pop text-3xl font-black gradient-text">
          {count}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setCount(0)}>
          Reset
        </Button>
      </div>
    </Card>
  );
}

function ToggleCard() {
  const [on, setOn] = useState(false);
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Toggle switch</h3>
      <Hint icon="🔁">The DOM attribute change is captured — the replay shows it flip.</Hint>
      <div className="mt-5 flex items-center gap-4">
        <button
          onClick={() => setOn((v) => !v)}
          className={`relative h-8 w-14 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
        </button>
        <Badge tone={on ? 'emerald' : 'slate'}>{on ? 'Enabled' : 'Disabled'}</Badge>
      </div>
    </Card>
  );
}

function TabsCard() {
  const tabs = ['Overview', 'Activity', 'Settings'];
  const [active, setActive] = useState(0);
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Tabs</h3>
      <Hint icon="🗂️">Switching tabs swaps DOM content — fully reconstructed in replay.</Hint>
      <div className="mt-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActive(i)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${active === i ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">You're viewing the <strong>{tabs[active]}</strong> tab.</p>
    </Card>
  );
}

function AccordionCard() {
  const [open, setOpen] = useState<number | null>(0);
  const items = [
    { q: 'Is my typing recorded?', a: 'Keystrokes are captured but masked — see the Forms page.' },
    { q: 'Does it work across pages?', a: 'Yes — navigation is part of the same session.' },
    { q: 'Can I block elements?', a: 'Wrap them in data-private and they never leave the browser.' },
  ];
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Accordion</h3>
      <Hint icon="📂">Expanding a row mutates the DOM — captured as it happens.</Hint>
      <div className="mt-5 divide-y divide-slate-100">
        {items.map((it, i) => (
          <div key={it.q}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-slate-700"
            >
              {it.q}
              <span className={`transition-transform ${open === i ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            <div className={`overflow-hidden text-sm text-slate-500 transition-all ${open === i ? 'max-h-24 pb-3' : 'max-h-0'}`}>
              {it.a}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DropdownCard() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('Pick one');
  const options = ['🍕 Pizza', '🍣 Sushi', '🌮 Tacos', '🍜 Ramen'];
  return (
    <Card className={open ? 'relative z-20' : ''}>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Dropdown menu</h3>
      <Hint icon="📋">Opening and selecting are separate recorded interactions.</Hint>
      <div className="relative mt-5">
        <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
          {choice} <span className="text-slate-400">⌄</span>
        </Button>
        {open && (
          <div className="absolute z-10 mt-2 w-48 animate-fade-up rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { setChoice(o); setOpen(false); }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
              >
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function LikeCard() {
  const [likes, setLikes] = useState(128);
  const [liked, setLiked] = useState(false);
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Like button</h3>
      <Hint icon="❤️">A tiny micro-interaction — still a recorded click.</Hint>
      <button
        onClick={() => {
          setLiked((v) => !v);
          setLikes((n) => (liked ? n - 1 : n + 1));
        }}
        className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all active:scale-90 ${liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600'}`}
      >
        <span className={liked ? 'animate-pop' : ''}>{liked ? '❤️' : '🤍'}</span>
        {likes} likes
      </button>
    </Card>
  );
}

function ModalCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Modal dialog</h3>
          <p className="text-sm text-slate-500">Opening overlays and closing them is all in the replay.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-pop rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-slate-900">👋 You opened a modal</h4>
            <p className="mt-2 text-sm text-slate-500">
              The dashboard replay will show this dialog appearing and disappearing exactly as it did now.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Got it</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
