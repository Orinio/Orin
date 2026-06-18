# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orin is an AI-powered career intelligence platform that turns scattered student work (GitHub repos, certificates, competitions, projects) into verified **Proof Cards** with confidence scores. It uses a multi-agent AI system with 8 specialized agents powered by NVIDIA NIM (Qwen models, not OpenAI).

## Repository Structure

Two independent packages — no monorepo tooling, no root `package.json`. Always `cd` into the package directory first.

```
Orin/
├── Backend-server/      # Express.js API (Node 22, TypeScript, port 3001)
├── Orin-Frontend/       # Next.js 16 App Router (React 19, Tailwind 4, port 3000)
├── schema.json          # Complete Supabase DB schema (42 tables) — source of truth for DB
└── supabase/            # Migrations and edge functions
```

## Dev Commands

### Backend (from `Backend-server/`)
```bash
npm run dev          # tsx watch, port 3001
npm run typecheck    # tsc --noEmit (strict mode)
npm test             # vitest run
npm run test:watch   # vitest watch
```

### Frontend (from `Orin-Frontend/`)
```bash
npm run dev          # next dev, port 3000
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (next/core-web-vitals + typescript)
npm test             # vitest run
npm run test:watch   # vitest watch
```

### Running a Single Test
```bash
cd Backend-server && npx vitest run __tests__/input-sanitizer.test.ts
cd Orin-Frontend && npx vitest run __tests__/validations.test.ts
```

### Verification Order (after changes)
1. `npm run typecheck` — catches type errors first
2. `npm run lint` — catches style issues (frontend only; no backend lint configured)
3. `npm test` — runs test suite

## Architecture

### Frontend → Backend Communication
- Next.js `/api/ai/chat-stream` API route **proxies** to Express backend at port 3001
- The frontend does NOT call the Express backend directly from the browser; it goes through Next.js API routes
- AI chat uses SSE (Server-Sent Events) with structured event types: `thinking`, `tool_start`, `tool_result`, `answer`, `complete`

### Backend AI Agent System (`Backend-server/src/lib/ai/`)
- **agents/** — 8 specialized agents (chat, coach, learning-path, opportunity-matcher, portfolio-scorer, safety-guard, skill-analysis, verification)
- **core/** — Agent runner, NVIDIA NIM client, types
- **orchestrator/** — Multi-agent coordinator with streaming and tool-calling loop (up to 10 iterations)
- **memory/** — MemoryManager (conversations, preferences, skill memory, learning progress, goals, facts)
- **tools/** — 20+ tool registrations (data, analysis, search, verification, memory, safety)

### Backend Middleware Order (matters)
requestId → Helmet → CORS → compression → rate limit → input sanitizer → dedup → timing → auth

### Frontend Component Groups
- `components/ai/` — AI chat interface (14 components: artifacts, markdown renderer, streaming, tool call display)
- `components/home/` — Landing page sections
- `components/ui/` — Reusable primitives (shadcn-style with cva)
- `components/providers/` — React Query provider

### Frontend Route Groups
- `(auth)/` — Sign in, sign up, password reset
- `(dashboard)/` — Main app pages (AI chat, coach, proofs, opportunities, settings)
- `(marketing)/` — Public pages (landing, about, pricing, blog, public profiles at `/[username]`)
- `admin-dev/` — Development admin panel
- `api/` — 13 API route groups

## Critical Technical Constraints

### Backend: NodeNext Module System
All relative imports MUST include `.js` extension:
```typescript
// Wrong
import { foo } from './bar'
// Right
import { foo } from './bar.js'
```

### Backend: Strict TypeScript
`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` are all enabled. Unused imports/variables/parameters will fail typecheck. No escape hatches.

### Frontend: Path Alias
`@/*` maps to the `Orin-Frontend/` root. Use `@/lib/supabase`, `@/components/ui/button`, etc.

### AI: NVIDIA NIM, Not OpenAI
Models are accessed via NVIDIA NIM API, not OpenAI. Chat uses Qwen 3.5 397B; Coach uses Qwen 3 Coder 480B. Requires `NVIDIA_API_KEY` env var.

## Environment Setup

Copy `.env.example` to `.env` (backend) or `.env.local` (frontend) in each package. Required keys:
- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`
- Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`

## Testing

- **Framework**: Vitest (globals enabled — `describe`, `it`, `expect` available without imports)
- **Backend**: `node` environment, env vars injected in `vitest.config.ts`
- **Frontend**: `jsdom` environment with `vitest.setup.ts` mocking: `next/navigation` (useRouter, usePathname, useSearchParams), `@/lib/supabase`, `@/lib/auth-context` (useAuth), `window.matchMedia`, `window.localStorage`
- Frontend test files are excluded from `tsconfig.json` compilation

## Conventions

- **Commits**: Conventional Commits — `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- **Database**: Schema source of truth is `schema.json`. Migrations in `Orin-Frontend/supabase/migrations/`.
- **Design tokens**: ink/paper/mist/spark/pulse/ember/bloom colors; Inter (sans), Lora (serif), JetBrains Mono (mono)
