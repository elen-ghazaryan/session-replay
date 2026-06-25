import { useState } from 'react';
import { Badge, Button, Card, Hint, SectionTitle } from '../components/ui';
import { Reveal } from '../components/Reveal';
import { notify } from '../components/toast';

type Product = { id: number; name: string; price: number; emoji: string };

const PRODUCTS: Product[] = [
  { id: 1, name: 'Aurora Headphones', price: 129, emoji: '🎧' },
  { id: 2, name: 'Nimbus Keyboard', price: 89, emoji: '⌨️' },
  { id: 3, name: 'Pulse Smartwatch', price: 199, emoji: '⌚' },
  { id: 4, name: 'Lumen Desk Lamp', price: 49, emoji: '💡' },
  { id: 5, name: 'Echo Speaker', price: 75, emoji: '🔊' },
  { id: 6, name: 'Drift Mouse', price: 39, emoji: '🖱️' },
];

export function Shop() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [drawer, setDrawer] = useState(false);
  const [done, setDone] = useState(false);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce(
    (sum, [id, qty]) => sum + (PRODUCTS.find((p) => p.id === Number(id))?.price ?? 0) * qty,
    0,
  );

  const add = (p: Product) => {
    setCart((c) => ({ ...c, [p.id]: (c[p.id] ?? 0) + 1 }));
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          eyebrow="Shop Journey"
          title="A realistic user flow"
          subtitle="Browse, add to cart, check out. This is the kind of journey a session replay is built to show."
        />
        <Button variant="secondary" onClick={() => setDrawer(true)}>
          🛒 Cart
          {count > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-bold text-white">
              {count}
            </span>
          )}
        </Button>
      </div>

      <Reveal>
        <Hint icon="🛍️">Add a few items, open the cart, and check out — then replay the whole journey.</Hint>
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p, i) => (
          <Reveal key={p.id} delay={i * 70}>
            <Card className="group h-full hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50 text-5xl transition-transform group-hover:scale-110">
                {p.emoji}
              </div>
              <h3 className="font-bold text-slate-900">{p.name}</h3>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-lg font-black text-slate-900">${p.price}</span>
                {cart[p.id] && <Badge tone="emerald">{cart[p.id]} in cart</Badge>}
              </div>
              <Button className="mt-4 w-full" onClick={() => add(p)}>
                Add to cart
              </Button>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Cart drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md animate-[fadeUp_0.3s] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h3 className="text-lg font-bold text-slate-900">Your cart</h3>
              <button onClick={() => setDrawer(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              {count === 0 ? (
                <p className="py-12 text-center text-slate-400">Your cart is empty.</p>
              ) : (
                <ul className="space-y-3">
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = PRODUCTS.find((x) => x.id === Number(id))!;
                    return (
                      <li key={id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                        <span className="text-2xl">{p.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">${p.price} × {qty}</p>
                        </div>
                        <button
                          onClick={() => {
                            setCart((c) => {
                              const next = { ...c };
                              delete next[Number(id)];
                              return next;
                            });
                          }}
                          className="text-slate-300 hover:text-rose-500"
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-slate-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-2xl font-black text-slate-900">${total}</span>
              </div>
              <Button
                className="w-full"
                disabled={count === 0}
                onClick={() => {
                  setDrawer(false);
                  setDone(true);
                  setCart({});
                  notify('Order placed!', 'checkout flow captured');
                }}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-pop rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-slate-900">Order confirmed!</h3>
            <p className="mt-2 text-sm text-slate-500">
              Now open the dashboard and replay this whole shopping journey from the first click.
            </p>
            <Button className="mt-6 w-full" onClick={() => setDone(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
