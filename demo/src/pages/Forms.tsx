import { useId, useState } from 'react';
import { Badge, Button, Card, Hint, SectionTitle } from '../components/ui';
import { Reveal } from '../components/Reveal';
import { blocked, notify } from '../components/toast';

// Mirrors the SDK's privacy.ts so the demo can SHOW what the backend receives.
function maskPreview(value: string, kind: string): string {
  if (!value) return '—';
  if (kind === 'password') return '********';
  if (kind === 'email') return '[email-masked]';
  if (kind === 'tel') return '[phone-masked]';
  if (kind === 'allow') return value;
  return '[masked]';
}

export function Forms() {
  return (
    <div className="space-y-12">
      <SectionTitle
        eyebrow="Forms & Privacy"
        title="Your data is captured — but masked"
        subtitle="The SDK records that you typed, never the secret itself. Watch the live preview to see exactly what leaves the browser."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <SignupForm />
        </Reveal>
        <Reveal delay={120}>
          <PrivacyShowcase />
        </Reveal>
      </div>
    </div>
  );
}

function SignupForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', search: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Sign-up form</h3>
      <Hint icon="⌨️">Type freely. The SDK records keystrokes, but masks the values below.</Hint>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          notify('Form submitted', 'masked values shipped to backend');
        }}
      >
        <Field label="Full name" value={form.name} onChange={set('name')} placeholder="Ada Lovelace" />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="ada@example.com" />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
        <Field label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 555 0100" />

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            Search query
            <Badge tone="emerald">data-allow</Badge>
          </label>
          <input
            data-allow
            value={form.search}
            onChange={set('search')}
            placeholder="Captured in clear text"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-slate-400">Marked safe with <code>data-allow</code> — recorded as typed.</p>
        </div>

        <Button type="submit" className="w-full">Create account</Button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          What the backend actually stores
        </p>
        <dl className="space-y-1.5 font-mono text-xs">
          <Row k="name" v={maskPreview(form.name, 'text')} />
          <Row k="email" v={maskPreview(form.email, 'email')} />
          <Row k="password" v={maskPreview(form.password, 'password')} />
          <Row k="phone" v={maskPreview(form.phone, 'tel')} />
          <Row k="search" v={maskPreview(form.search, 'allow')} safe />
        </dl>
      </div>
    </Card>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function Row({ k, v, safe = false }: { k: string; v: string; safe?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{k}</dt>
      <dd className={safe ? 'text-emerald-600' : 'text-rose-500'}>{v}</dd>
    </div>
  );
}

function PrivacyShowcase() {
  const [card, setCard] = useState('');
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold text-slate-900">Block sensitive regions</h3>
      <Hint icon="🛡️">
        Anything inside <code>data-private</code> is skipped entirely — it never reaches the recording.
      </Hint>

      <div
        data-private
        className="mt-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-amber-700">💳 Payment details</span>
          <Badge tone="amber">data-private</Badge>
        </div>
        <input
          value={card}
          onChange={(e) => setCard(e.target.value)}
          placeholder="4242 4242 4242 4242"
          className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 font-mono text-sm outline-none"
        />
        <p className="mt-3 text-xs text-amber-700/80">
          In the replay this whole block renders as a blank placeholder — type anything, it stays here.
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={() => blocked('Card field interaction', 'inside data-private — not recorded')}
        >
          Simulate a private click
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-6 text-sm font-semibold text-indigo-600 transition-transform hover:-translate-y-0.5"
        >
          🎬 Recorded
          <span className="mt-1 block text-xs font-normal text-indigo-400">normal element</span>
        </button>
        <button
          data-private
          onClick={() => blocked('Private button click', 'data-private — not recorded')}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm font-semibold text-amber-600 transition-transform hover:-translate-y-0.5"
        >
          🛡️ Not recorded
          <span className="mt-1 block text-xs font-normal text-amber-400">data-private element</span>
        </button>
      </div>
    </Card>
  );
}
