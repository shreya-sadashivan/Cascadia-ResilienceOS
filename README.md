# ResilienceOS — India

A demonstration app for simulating cascading infrastructure failures across a synthetic Indian
urban network (power, water, transport, healthcare, telecom, population). Pick a hazard, trigger
a scenario, and watch how the failure propagates: which assets go down, which hospitals overload,
how emergency response times change, and how long recovery takes.

**All infrastructure and numeric values are synthetic demonstration data.** This is not a model of
any real city or utility network.

## Stack

- **Frontend:** React 19 + Vite + TypeScript, Tailwind CSS, Radix UI / shadcn-style components
- **Backend:** Express + TypeScript (`tsx`), a small in-memory graph/cascade simulation engine
- **Package manager:** the repo is set up for **pnpm** (see [Notes](#notes) below if you're using npm)

## Project structure

```
client/src/          React app (pages, components, contexts, hooks)
server/               Express API
  data/assets.ts       Synthetic network definition (nodes + edges)
  simulation/           Cascade, capacity, graph, and analytics logic
  routes/                /api/network, /api/simulate, /api/analytics/*, /api/scenarios
  types/                 Shared simulation types
shared/const.ts        Constants shared between client and server
scripts/dev-all.mjs    Runs frontend + backend together for local dev
BACKEND_INTEGRATION.md API reference and architecture notes
```

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- pnpm (recommended — see [Notes](#notes)), or npm/yarn if you prefer

## Getting started

```bash
# install dependencies
pnpm install        # or: npm install

# run frontend + backend together
pnpm dev:all         # or: npm run dev:all
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001 (Vite proxies `/api/*` to it automatically in dev)

## Available scripts

| Script | What it does |
|---|---|
| `dev` | Runs the Vite dev server only (frontend) |
| `server` | Runs the Express backend once (`tsx server/index.ts`) |
| `dev:backend` | Runs the backend with auto-restart on file changes |
| `dev:all` | Runs frontend and backend together (recommended for local dev) |
| `build` | Builds the frontend (Vite) and bundles the backend (esbuild) into `dist/` |
| `start` | Runs the production build (`NODE_ENV=production node dist/index.js`) |
| `preview` | Serves the built frontend locally for a quick check |
| `check` | Type-checks the whole project with `tsc --noEmit` |
| `format` | Formats the codebase with Prettier |

## Production build

```bash
pnpm build
pnpm start
```

This builds the frontend into `dist/public` and bundles the server into `dist/index.js`, which
serves the built frontend and the API from a single Express process on `$PORT` (default `3001`).

## API

See [`BACKEND_INTEGRATION.md`](./BACKEND_INTEGRATION.md) for the full API reference
(`GET /api/network`, `POST /api/simulate`, `GET /api/analytics/criticality`,
`GET /api/analytics/bottlenecks`, `GET /api/scenarios`, `GET /api/scenarios/:name`) and an example
request/response.

## Notes

- **Use pnpm if you can.** `package.json` pins `packageManager: pnpm` and patches one dependency
  (`wouter`) via `pnpm.patchedDependencies`. npm and yarn will ignore that patch field, so if you
  install with npm, `wouter` will be the unpatched version — usually fine, but worth knowing if
  you hit routing oddities. Install pnpm with `npm install -g pnpm` if you don't have it.
- **`npm install` fails with `ENOTEMPTY`/`rename` errors:** this is a local filesystem issue, not
  a project issue — most commonly caused by running the install inside a folder that's under
  iCloud Drive's "Desktop & Documents" sync (or Dropbox/OneDrive) on macOS, which locks/moves
  files mid-install. Delete `node_modules` and `package-lock.json`, move the project outside the
  synced folder (e.g. `~/Projects/...`), and reinstall.
- The simulation engine used to be duplicated on the frontend for prototyping; it now lives only
  in `server/simulation/`, and the client renders whatever the backend returns.
