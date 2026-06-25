# Tracker SDK — Demo Site

A friendly, guided playground for the Tracker analytics + session-replay SDK.
Every interaction is recorded via rrweb and replayable in the dashboard.

## Run it

The demo imports the SDK from `../sdk/src` and ships events to the backend at
`http://localhost:8080/api/track`, so start those first.

```bash
# 1. backend (from repo root)
cd backend && ./gradlew bootRun

# 2. dashboard (to view replays) — http://localhost:5173
cd dashboard && npm install && npm run dev

# 3. this demo — http://localhost:5174
cd demo && npm install && npm run dev
```

Open http://localhost:5174, interact with the pages, then use the **View replay**
button in the on-screen recorder (bottom-left) to jump to your session in the dashboard.

## Pages

- **Home** — overview + guided steps.
- **Playground** — clicks, toggles, tabs, accordion, dropdown, modal.
- **Forms & Privacy** — input masking + `data-private` / `data-allow` behavior.
- **Dynamic UI** — DOM mutations: live lists, load-more, live clock, progress.
- **Shop Journey** — a realistic browse → cart → checkout flow.

## How it's wired

`src/tracker.ts` wraps the SDK singleton (`Tracker.init` / `Tracker.stop`) in a
small store so React can show recording state and the live session id. Recording
starts automatically on load; the recorder panel can stop/restart it.

Toasts are reserved for real app feedback — a "Done" confirmation on checkout and
form submit, and a "Not recorded" notice when you interact with a `data-private`
region. They're illustrative UI, not reads of SDK internals.
