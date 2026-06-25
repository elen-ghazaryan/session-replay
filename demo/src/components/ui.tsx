import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'text-white brand-gradient shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/25',
  success: 'text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-500">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="mt-3 text-lg text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'indigo' }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone] ?? tones.indigo}`}
    >
      {children}
    </span>
  );
}

export function Hint({ children, icon = '👆' }: { children: ReactNode; icon?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm text-indigo-700">
      <span className="leading-tight">{icon}</span>
      <span className="leading-snug">{children}</span>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-600 shadow-sm">
      {children}
    </kbd>
  );
}
