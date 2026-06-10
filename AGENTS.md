# AGENTS.md — Orin Repository Guide

## Project Layout

Two independent packages (no monorepo tooling — no turborepo/nx/lerna, no root `package.json`):

```
Orin/
├── Backend-server/    # Express.js API (Node 22, TypeScript, port 3001)
├── Orin-Frontend/     # Next.js 16 App Router (React 19, Tailwind 4, port 3000)
├── schema.json        # Complete Supabase DB schema (42 tables) — source of truth for DB
└── supabase/          # Migrations and edge functions
```

## Dev Commands

```bash
# Backend
cd Backend-server
npm run dev          # tsx watch, port 3001
npm run typecheck    # tsc --noEmit (strict — noUnusedLocals, noUnusedParameters)
npm test             # vitest run (node env, globals enabled)

# Frontend
cd Orin-Frontend
npm run dev          # next dev, port 3000
npm run lint         # eslint (next/core-web-vitals + typescript)
npm run typecheck    # tsc --noEmit
npm test             # vitest run (jsdom env, globals enabled)
```

There are no root-level scripts. Always `cd` into the package directory first.

## Verification Order

After making changes, run checks in this order within the affected package:

1. `npm run typecheck` — catches type errors
2. `npm run lint` — catches style issues (frontend only, no backend lint configured)
3. `npm test` — runs test suite

## Key Architecture Facts

- **AI Backend**: NVIDIA NIM API (not OpenAI). Models: Qwen 3.5 397B (chat), Qwen 3 Coder 480B (coach). Requires `NVIDIA_API_KEY`.
- **Database**: Supabase (PostgreSQL + RLS). Schema is in root `schema.json`. Migrations in `Orin-Frontend/supabase/migrations/`.
- **Backend Module System**: `NodeNext` — **all relative imports MUST include `.js` extension** (e.g., `import { foo } from './bar.js'`).
- **Frontend Path Alias**: `@/*` maps to the `Orin-Frontend/` root.
- **Backend Strict TS**: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` are all enabled. Unused imports will fail typecheck.
- **Frontend API Proxy**: `/api/ai/chat-stream` in Next.js proxies to the Express backend at port 3001.

## Environment Setup

Both packages require `.env` files copied from `.env.example`:

- `Backend-server/.env` — required vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`
- `Orin-Frontend/.env.local` — required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`

Backend `.env.example` lives at `Backend-server/.env.example`. Frontend at `Orin-Frontend/.env.example`.

## Testing

- **Framework**: Vitest (globals enabled — `describe`, `it`, `expect` available without imports)
- **Backend**: `node` environment, env vars injected inline in `vitest.config.ts`
- **Frontend**: `jsdom` environment, uses `vitest.setup.ts` which mocks:
  - `next/navigation` (useRouter, usePathname, useSearchParams)
  - `@/lib/supabase` (Supabase client)
  - `@/lib/auth-context` (useAuth)
  - `window.matchMedia` and `window.localStorage`

Frontend test files excluded from `tsconfig.json` compilation.

## Deployment

- **Frontend**: Vercel (auto-deployed from `main` via GitHub Actions)
- **Backend**: Railway via Docker multi-stage build (`node:22-alpine`). Health check: `/health`.
- **CI**: GitHub Actions — lint, typecheck, test, build on push to `main`/`develop`

## Conventions

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Backend middleware order matters: requestId → Helmet → CORS → compression → rate limit → input sanitizer → dedup → timing → auth
- AI agent system lives in `Backend-server/src/lib/ai/` — agents in `agents/`, tools in `tools/`, orchestrator in `orchestrator/`, memory in `memory/`
- Frontend components: `components/ai/` (18 AI components), `components/home/` (landing page), `components/ui/` (reusable primitives)
