# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Tusoskop is a React 19 + Vite 8 SPA for TUS (Turkish medical specialization exam) preparation, backed by Firebase (Auth, Firestore, Cloud Functions, Hosting).

### Commands

All commands are documented in README.md and `package.json` scripts. Key ones:

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 5173) |
| Lint | `npm run lint` |
| Unit tests | `npm run test` |
| Build | `npm run build` |
| E2E tests | `npm run test:e2e` (requires `dist/` — run `npm run build` first) |
| E2E full | `npm run test:e2e:full` (build + E2E in one) |
| Question bank validation | `npm run validate:questions` |

### Caveats

- The `.npmrc` sets `legacy-peer-deps=true`; always use `npm ci` (not `npm install`) to respect the lockfile.
- Cloud Functions (`functions/`) target Node 20 but work fine under Node 22 locally (engine warning is benign).
- Firebase config is hardcoded in `src/firebase.js`; no env-var setup is needed for the dev server to start, but authentication and Firestore calls require internet access to Firebase's remote services.
- Playwright E2E tests use the `vite preview` server (port 4173) against the production build in `dist/`. The `dist/` folder must exist before running `npm run test:e2e`.
- ESLint ignores `src/data/questionChunks` and `functions/` directories.
- Vite config uses `--configLoader native` flag (see package.json scripts).
