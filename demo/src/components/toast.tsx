import { useSyncExternalStore } from 'react';

export type ToastTone = 'info' | 'success' | 'private';
export type Toast = { id: number; title: string; detail?: string; tone: ToastTone };

let toasts: Toast[] = [];
let nextId = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

function push(t: Omit<Toast, 'id'>) {
  const toast: Toast = { ...t, id: ++nextId };
  toasts = [...toasts, toast];
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== toast.id);
    emit();
  }, 2800);
}

export const blocked = (title: string, detail?: string) => push({ title, detail, tone: 'private' });
export const notify = (title: string, detail?: string) => push({ title, detail, tone: 'success' });

const tones: Record<ToastTone, { ring: string; icon: string; label: string; heading: string }> = {
  info: { ring: 'border-slate-200 bg-white', icon: 'ℹ️', label: 'text-slate-600', heading: 'Info' },
  success: { ring: 'border-emerald-200 bg-white', icon: '✓', label: 'text-emerald-600', heading: 'Done' },
  private: { ring: 'border-amber-200 bg-white', icon: '🛡️', label: 'text-amber-600', heading: 'Not recorded' },
};

function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => toasts,
  );
}

export function Toaster() {
  const items = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-3">
      {items.map((t) => {
        const tone = tones[t.tone];
        return (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto rounded-xl border ${tone.ring} px-4 py-3 shadow-lg shadow-slate-900/5`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none">{tone.icon}</span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wide ${tone.label}`}>
                  {tone.heading}
                </p>
                <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                {t.detail && <p className="truncate text-xs text-slate-500">{t.detail}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
