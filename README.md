<div align="center">

# <img src="Orin-Frontend/public/logo.svg" alt="Orin Logo" width="100" height="100">

# Orin

### *Turn Work Into Career Proof*

[![CI](https://github.com/your-username/Orin/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/Orin/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-4ade80.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com)

**Orin** is an AI-powered career development platform that transforms scattered work — projects, commits, certificates, competitions — into verified **Proof Cards** that showcase real skills. It features a multi-agent AI system, real-time coaching, opportunity matching, and a Claude-inspired chat experience.

[Get Started](#-getting-started) · [Features](#-features) · [Architecture](#-architecture) · [AI System](#-ai-system) · [API Reference](#-api-routes) · [Deploy](#-deployment)

</div>

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [AI System](#-ai-system)
- [Frontend Pages](#-frontend-pages)
- [API Routes](#-api-routes)
- [Testing](#-testing)
- [Security](#-security)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## Features

### Core Platform
| Feature | Description |
|---|---|
| **Proof Cards** | Turn projects, commits, and certificates into verified, shareable achievements |
| **Skill Tracking** | Extract, track, and visualize skills with confidence levels and demand data |
| **Opportunity Matching** | AI matches your proof portfolio to jobs, internships, scholarships, and hackathons |
| **Public Profiles** | Shareable profile pages at `/[username]` for recruiters |
| **Source Connections** | Link GitHub repos, Kaggle, LinkedIn, and certificate sources |
| **Real-time Notifications** | Verification updates, opportunity matches, and coaching tips |

### AI System
| Feature | Description |
|---|---|
| **8 Specialized Agents** | Chat, Coach, Learning Path, Opportunity Matcher, Portfolio Scorer, Safety Guard, Skill Analysis, Verification |
| **Multi-Agent Orchestrator** | Coordinates agent execution with memory, tool calling, and streaming responses |
| **Tool Calling** | 20+ tools for data fetching, verification, analysis, search, and memory operations |
| **AI Memory System** | Persistent conversations, user preferences, skill memory, learning progress, goals, and facts |
| **Claude-Inspired Chat UX** | Split-pane artifacts, inline web search citations, streaming markdown, stop generation, file upload |
| **Real-time Streaming** | Server-Sent Events with structured `thinking`, `tool_start`, `tool_result`, `answer` events |

### Engineering
| Feature | Description |
|---|---|
| **Monorepo Architecture** | Frontend (Next.js) + Backend (Express) + Supabase in one repository |
| **Production-Grade Security** | Helmet, CSP, CORS allowlist, rate limiting, input sanitization, SSRF protection |
| **Full Test Coverage** | 17 test files across frontend and backend with Vitest |
| **CI/CD Pipeline** | GitHub Actions with lint, typecheck, test, build, and deploy stages |
| **Error Monitoring** | Sentry integration for client, server, and edge environments |
| **Docker Support** | Multi-stage Alpine build for backend deployment |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 16.2.6 |
| **UI Library** | React | 19.2.4 |
| **Styling** | Tailwind CSS | 4 |
| **State Management** | TanStack React Query | 5.101 |
| **Animations** | Framer Motion | 12.40 |
| **Icons** | Lucide React | 0.577 |
| **Notifications** | Sonner | 2.0.7 |
| **Form Validation** | Zod | 4.4.3 |
| **Class Utilities** | clsx + tailwind-merge + cva | — |
| **Backend Runtime** | Node.js | 22 |
| **Backend Framework** | Express | 4.21 |
| **Database** | Supabase (PostgreSQL + RLS) | 2.49 |
| **AI / LLM** | NVIDIA NIM API | — |
| **LLM Models** | Qwen 3.5 397B, Qwen 3 Coder 480B | — |
| **Edge Functions** | Supabase Edge Functions (Deno) | — |
| **Logging** | Pino + pino-pretty | — |
| **Validation (Backend)** | Zod | 3.23 |
| **Testing** | Vitest | 4.1 |
| **Error Tracking** | Sentry | 10.56 |
| **CI/CD** | GitHub Actions | — |
| **Frontend Deploy** | Vercel | — |
| **Backend Deploy** | Railway (Docker) | — |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js 16 (Vercel)                            │   │
│  │                                                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │
│  │  │  Auth    │ │Dashboard │ │ AI Chat  │ │  Proof   │      │   │
│  │  │  Pages   │ │  Pages   │ │  (SSE)   │ │  Pages   │      │   │
│  │  └──────────┘ └──────────┘ └────┬─────┘ └──────────┘      │   │
│  │                                 │                           │   │
│  │  ┌──────────────────────────────┴──────────────────────┐   │   │
│  │  │              API Routes (Next.js)                    │   │   │
│  │  │  /api/ai/chat-stream  →  proxies to backend         │   │   │
│  │  │  /api/auth/*          →  Supabase Auth               │   │   │
│  │  │  /api/proofs/*        →  Supabase queries            │   │   │
│  │  └──────────────────────────────┬──────────────────────┘   │   │
│  └─────────────────────────────────┼─────────────────────────┘   │
│                                    │                              │
└────────────────────────────────────┼──────────────────────────────┘
                                     │ HTTPS
┌────────────────────────────────────┼──────────────────────────────┐
│                                    │                              │
│  ┌─────────────────────────────────┴─────────────────────────┐   │
│  │           Express.js Backend (Railway / Docker)            │   │
│  │                                                            │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │  Auth +    │  │   Agent      │  │  Middleware Stack │  │   │
│  │  │  Rate      │  │   Runner     │  │  - Helmet/CSP    │  │   │
│  │  │  Limiting  │  │              │  │  - CORS          │  │   │
│  │  └────────────┘  │  ┌────────┐ │  │  - Sanitization  │  │   │
│  │                  │  │Chat    │ │  │  - Deduplication │  │   │
│  │  ┌────────────┐  │  │Coach   │ │  │  - Timing/Logger │  │   │
│  │  │  Tool      │  │  │Verify  │ │  └──────────────────┘  │   │
│  │  │  Registry  │  │  │Skill   │ │                         │   │
│  │  │            │  │  │Learn   │ │  ┌──────────────────┐  │   │
│  │  │ data.tools │  │  │Match   │ │  │  Memory Manager  │  │   │
│  │  │ analysis   │  │  │Safety  │ │  │  - Conversations │  │   │
│  │  │ search     │  │  │...     │ │  │  - Preferences   │  │   │
│  │  │ verify     │  │  └────────┘ │  │  - Skill Memory  │  │   │
│  │  │ safety     │  └──────────────┘  │  - Learning      │  │   │
│  │  └────────────┘                    │  - Goals / Facts  │  │   │
│  │                                    └──────────────────┘  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────┴───────────────────────────────┐   │
│  │              NVIDIA NIM API                               │   │
│  │  Qwen 3.5 397B (chat) · Qwen 3 Coder 480B (coach)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Supabase                                     │   │
│  │  PostgreSQL + RLS + Auth + Edge Functions + pg_cron       │   │
│  │  42 tables · 2 edge functions · 4 migrations             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Sentry                                       │   │
│  │  Client + Server + Edge error tracking                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (recommended: 22)
- **npm** or **yarn**
- **Supabase** account (free tier works) — [supabase.com](https://supabase.com)
- **NVIDIA NIM** API key — [build.nvidia.com](https://build.nvidia.com)
- **Vercel** account (for frontend deployment) — [vercel.com](https://vercel.com)
- **Railway** account (for backend deployment) — [railway.app](https://railway.app)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Orin.git
cd Orin
```

### 2. Set Up Supabase

1. Create a new project on [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of each migration file in order:
   ```
   Orin-Frontend/supabase/migrations/20260603000000_add_coach_cron_jobs.sql
   Orin-Frontend/supabase/migrations/20260605000000_seed_opportunities.sql
   Orin-Frontend/supabase/migrations/20260605000001_create_ai_usage_log.sql
   Orin-Frontend/supabase/migrations/20260606000000_create_ai_memory_tables.sql
   ```
3. Or use `schema.json` as the complete reference for all 42 tables

### 3. Install Dependencies

```bash
# Backend
cd Backend-server
npm install

# Frontend
cd ../Orin-Frontend
npm install
```

### 4. Configure Environment Variables

```bash
# Backend
cp Backend-server/.env.example Backend-server/.env
# Edit Backend-server/.env with your keys

# Frontend
cp Orin-Frontend/.env.example Orin-Frontend/.env.local
# Edit Orin-Frontend/.env.local with your keys
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd Backend-server
npm run dev

# Terminal 2 — Frontend (port 3000)
cd Orin-Frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
Orin/
├── schema.json                          # Complete database schema (42 tables)
├── LICENSE                              # MIT License
│
├── Backend-server/                      # Express.js API server
│   ├── Dockerfile                       # Multi-stage Docker build
│   ├── railway.json                     # Railway deployment config
│   ├── vitest.config.ts                 # Test configuration
│   ├── __tests__/                       # 12 test files
│   └── src/
│       ├── index.ts                     # Express app entry point
│       ├── lib/
│       │   ├── ai/                      # AI agent system
│       │   │   ├── agents/              # 8 specialized agents
│       │   │   ├── core/                # Agent runner, NVIDIA client, types
│       │   │   ├── memory/              # Memory manager (conversations, preferences, goals)
│       │   │   ├── orchestrator/        # Multi-agent coordinator with streaming
│       │   │   ├── services/            # Embedding, safety, vision services
│       │   │   └── tools/               # 20+ tool registrations
│       │   ├── supabase.ts              # Supabase client
│       │   ├── context.ts               # User context builder
│       │   ├── prompts.ts               # System prompts
│       │   ├── skills.ts                # Skill extraction logic
│       │   └── validations.ts           # Zod schemas
│       ├── middleware/                   # 9 middleware (auth, security, logging)
│       └── routes/                      # 10 route groups
│
├── Orin-Frontend/                       # Next.js 16 application
│   ├── app/                             # App Router pages
│   │   ├── (auth)/                      # Authentication pages
│   │   ├── (dashboard)/                 # Main application pages
│   │   ├── (marketing)/                 # Public marketing pages
│   │   ├── admin-dev/                   # Development admin panel
│   │   ├── auth/callback/               # OAuth callback handler
│   │   └── api/                         # 13 API route groups
│   ├── components/
│   │   ├── ai/                          # 14 AI components (chat, artifacts, markdown)
│   │   ├── home/                        # 8 landing page sections
│   │   ├── ui/                          # 12 reusable UI primitives
│   │   └── providers/                   # React Query provider
│   ├── lib/                             # Utilities, Supabase clients, AI tools
│   ├── hooks/                           # Custom React hooks
│   ├── styles/                          # CSS design tokens
│   ├── supabase/                        # Migrations + Edge Functions
│   │   ├── migrations/                  # 4 SQL migration files
│   │   └── functions/                   # 2 Deno edge functions
│   ├── docs/                            # Internal documentation
│   ├── public/                          # Static assets
│   └── __tests__/                       # 5 test files
│
└── .github/workflows/ci.yml            # GitHub Actions CI/CD
```

---

## Database Schema

Orin uses **Supabase** (PostgreSQL) with **Row Level Security (RLS)** on all user-facing tables. The complete schema is defined in [`schema.json`](./schema.json) with **42 tables**.

### Core Tables

| Table | Description |
|---|---|
| `users` | Core user accounts with profile data, plan tier, onboarding status |
| `proof_cards` | Verified achievements — projects, certificates, competitions, contributions |
| `proof_shares` | Sharing records for proof cards |
| `proof_views` | Analytics for proof card views |
| `skills` | Extracted skills with categories, levels, and market demand data |
| `sources` | Connected data sources (GitHub, Kaggle, LinkedIn, certificates) |

### AI Memory Tables

| Table | Description |
|---|---|
| `ai_conversations` | Chat history per user per agent (jsonb messages) |
| `ai_user_preferences` | Learning style, communication tone, interests, career goals |
| `ai_skill_memory` | Skill level assessments with confidence and source tracking |
| `ai_learning_progress` | Progress tracking with milestones (jsonb) |
| `ai_goals` | Career goals with status, progress, deadlines |
| `ai_facts` | User-specific facts with importance scoring |

### Opportunity Tables

| Table | Description |
|---|---|
| `opportunities` | Jobs, internships, scholarships, hackathons, research positions |
| `user_opportunities` | Saved/bookmarked opportunities per user |
| `user_opportunity_matches` | AI-calculated match scores between users and opportunities |
| `opportunity_details` | Extended opportunity metadata |

### Platform Tables

| Table | Description |
|---|---|
| `subscriptions` | User subscription plans with trial tracking |
| `notifications` | User notification feed |
| `notification_preferences` | Per-user notification settings |
| `coach_notes` | AI-generated coaching notes and daily tips |
| `audit_log` | Admin audit trail |
| `contact_messages` | Contact form submissions |
| `saved_searches` | User saved search filters |
| `user_integrations` | Third-party integration configs |
| `user_profiles` | Extended profile data |
| `user_dashboard` | Dashboard state data |

### Partitioned Tables

| Table | Description |
|---|---|
| `proof_views_2026_02` through `proof_views_2026_09` | Monthly partitioned proof view analytics |

### Key Enums

| Enum | Values |
|---|---|
| `proof_source_type` | `github`, `certificate`, `kaggle`, `linkedin`, `other` |
| `user_year` | `first`, `second`, `third`, `fourth`, `graduate` |

---

## AI System

Orin's AI is a **multi-agent system** with 8 specialized agents, 20+ tools, persistent memory, and a Claude-inspired streaming chat interface.

### Agents

| Agent | File | Purpose | Model |
|---|---|---|---|
| **Chat** | `chat.agent.ts` | General conversation with full tool access | Qwen 3.5 397B |
| **Coach** | `coach.agent.ts` | Career coaching with portfolio analysis | Qwen 3 Coder 480B |
| **Learning Path** | `learning-path.agent.ts` | Personalized learning recommendations | Qwen 3.5 397B |
| **Opportunity Matcher** | `opportunity-matcher.agent.ts` | Match skills to opportunities | Qwen 3.5 397B |
| **Portfolio Scorer** | `portfolio-scorer.agent.ts` | Score and rank proof cards | Qwen 3.5 397B |
| **Safety Guard** | `safety-guard.agent.ts` | Content safety and moderation | Qwen 3.5 397B |
| **Skill Analysis** | `skill-analysis.agent.ts` | Extract and assess skills | Qwen 3.5 397B |
| **Verification** | `verification.agent.ts` | Verify proof claims | Qwen 3.5 397B |

### Tool Categories

| Category | Tools | Description |
|---|---|---|
| **Data** | `fetch_user_profile`, `fetch_user_proofs`, `get_user_portfolio_summary` | Fetch user data from Supabase |
| **Analysis** | `analyze_skill_match`, `calculate_portfolio_score` | Analyze skills and portfolio quality |
| **Search** | `search_web`, `search_opportunities` | Web and opportunity search |
| **Verification** | `verify_github`, `verify_certificate`, `verify_source` | Verify proof claims |
| **Memory** | `save_conversation`, `fetch_conversation_history` | Persist chat history |
| **Safety** | `check_content_safety` | Content moderation |

### Agent Orchestrator

The orchestrator (`agent-orchestrator.ts`) manages multi-agent execution:

1. **Input Sanitization** — Cleans user input, removes injection attempts
2. **Memory Load** — Retrieves user preferences, skills, goals, and facts
3. **Tool Loop** — Executes agent with tool calling (up to 10 iterations)
4. **Streaming** — Sends structured SSE events to the client
5. **Memory Save** — Persists conversation and updates user knowledge

**SSE Event Types:**
```
thinking       → Agent reasoning steps
tool_start     → Tool invocation begins
tool_result    → Tool execution result
answer         → Answer text chunks (streamed)
complete       → Final metadata (tokens, tools used, iterations)
```

### Memory System

The `MemoryManager` provides persistent AI memory across sessions:

| Store | Description |
|---|---|
| **Conversations** | Full chat history per agent per user |
| **Preferences** | Learning style, communication tone, interests |
| **Skill Memory** | Skill levels with confidence and assessment dates |
| **Learning Progress** | Skill progress with milestones |
| **Goals** | Career goals with status and deadlines |
| **Facts** | User-specific facts with importance scoring |

### Chat Interface (Claude-Inspired)

The AI Chat page (`ai-chat/page.tsx`) provides:

- **Split-Pane Artifacts** — Code, HTML, and markdown rendered in a side panel
- **Web Search Citations** — Inline numbered references with source cards
- **Streaming Markdown** — Real-time rendered markdown with syntax highlighting
- **Stop Generation** — Cancel in-flight requests with AbortController
- **Collapsible Thinking** — Expandable reasoning steps
- **File Upload** — Drag-and-drop with preview chips (PDF, images, code, docs)
- **Smart Auto-Scroll** — Only scrolls when user is near bottom (150px threshold)
- **Tool Call Display** — Collapsible chips showing tool invocations

### Supabase Edge Functions

| Function | Runtime | Purpose |
|---|---|---|
| `ai-coach` | Deno | Generate coaching notes using Llama 3.3 70B |
| `ai-verify` | Deno | Tool-use agentic verification with Llama 3.1 8B |

---

## Frontend Pages

### Authentication (`(auth)/`)
| Route | Page |
|---|---|
| `/signin` | Email/password sign in |
| `/signup` | Account registration |
| `/reset-password` | Password reset request |
| `/update-password` | Set new password |

### Dashboard (`(dashboard)/`)
| Route | Page |
|---|---|
| `/dashboard` | Main dashboard with stats and overview |
| `/dashboard/ai-chat` | Claude-inspired AI chat interface |
| `/dashboard/ai-agents` | Agent dashboard and management |
| `/dashboard/coach` | AI career coach |
| `/dashboard/analytics` | Proof and skill analytics |
| `/dashboard/proof/new` | Create new proof card |
| `/dashboard/proof/[id]` | View proof card |
| `/dashboard/proof/[id]/edit` | Edit proof card |
| `/dashboard/sources` | Connected data sources |
| `/dashboard/sources/new` | Add new source |
| `/integrations` | Third-party integrations |
| `/notifications` | Notification feed |
| `/opportunities` | Browse matched opportunities |
| `/settings` | Account and notification settings |

### Marketing (`(marketing)/`)
| Route | Page |
|---|---|
| `/` | Landing page with hero, features, pricing, testimonials |
| `/about` | About Orin |
| `/features` | Feature showcase |
| `/pricing` | Pricing plans |
| `/blog` | Blog |
| `/docs` | Documentation |
| `/faq` | FAQ |
| `/careers` | Careers |
| `/contact` | Contact form |
| `/legal` | Legal pages |
| `/status` | System status |
| `/[username]` | Public user profile |

### Admin (`admin-dev/`)
| Route | Page |
|---|---|
| `/admin-dev` | Development admin dashboard |
| `/admin-dev/login` | Admin login |

---

## API Routes

### Backend API (Express — port 3001)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/health` | GET | No | Health check |
| `/ai` | POST | Yes | AI agent execution |
| `/ai/chat-stream` | POST | Yes | Streaming chat with orchestrator |
| `/ai/embeddings` | POST | Yes | Generate embeddings |
| `/ai/vision` | POST | Yes | Image analysis |
| `/ai/safety` | POST | Yes | Content safety check |
| `/ai/agents` | GET/POST | Yes | Agent management |
| `/coach` | POST | Yes | AI coaching |
| `/webhooks` | POST | No | GitHub/Stripe webhooks |
| `/jobs` | GET | Yes | Background job management |
| `/metrics` | GET | No | Internal metrics |

### Frontend API Routes (Next.js)

| Route | Method | Description |
|---|---|---|
| `/api/ai/chat` | POST | AI chat |
| `/api/ai/chat-stream` | POST | Proxies to backend chat-stream |
| `/api/ai/learning-path` | POST | Learning path generation |
| `/api/ai/match-opportunities` | POST | Opportunity matching |
| `/api/ai/skills` | POST | Skill extraction |
| `/api/ai/verify` | POST | Proof verification |
| `/api/auth/signin` | POST | Sign in |
| `/api/auth/signup` | POST | Sign up |
| `/api/coach-notes` | GET/POST | Coach notes CRUD |
| `/api/coach-notes/generate` | POST | Generate coach note |
| `/api/contact` | POST | Contact form |
| `/api/notifications` | GET | User notifications |
| `/api/notifications/[id]` | PATCH/DELETE | Notification actions |
| `/api/notifications/[id]/read` | POST | Mark as read |
| `/api/notifications/read-all` | POST | Mark all as read |
| `/api/opportunities` | GET | List opportunities |
| `/api/opportunities/save` | POST | Save opportunity |
| `/api/proofs` | GET/POST | Proof cards CRUD |
| `/api/proof/share` | POST | Share proof |
| `/api/sources` | GET/POST | Sources CRUD |
| `/api/user/notification-prefs` | GET/PUT | Notification preferences |
| `/api/user/profile` | GET/PUT | User profile |
| `/api/user/subscription` | GET | Subscription status |
| `/api/users/[username]` | GET | Public user profile |
| `/api/admin-dev/*` | * | Admin development endpoints |

---

## Testing

### Run All Tests

```bash
# Backend
cd Backend-server
npm test

# Frontend
cd Orin-Frontend
npm test
```

### Backend Tests (12 files)

| File | Tests |
|---|---|
| `agent-runner.test.ts` | Agent execution, error handling |
| `ai.test.ts` | AI route handlers |
| `app-error.test.ts` | Custom error class |
| `error-handler.test.ts` | Error middleware |
| `input-sanitizer.test.ts` | XSS/injection prevention |
| `rate-limit.test.ts` | Rate limiting |
| `raw-body.test.ts` | Raw body capture for webhooks |
| `request-deduplication.test.ts` | Duplicate request prevention |
| `request-timing.test.ts` | Request timing |
| `server.test.ts` | Server startup and config |
| `skills.test.ts` | Skill extraction |
| `validations.test.ts` | Zod validation schemas |

### Frontend Tests (5 files)

| File | Tests |
|---|---|
| `prompts.test.ts` | AI prompt generation |
| `rate-limit.test.ts` | Client-side rate limiting |
| `ssrf.test.ts` | SSRF protection |
| `validations.test.ts` | Form validation schemas |
| `skills.test.ts` | Skill extraction |

### Test Infrastructure

- **Framework:** Vitest with globals enabled
- **Backend:** Node environment with test env vars injected
- **Frontend:** jsdom environment with mocked Supabase, auth, navigation, and `matchMedia`

---

## Security

Orin implements a defense-in-depth security model:

### Middleware Stack

| Middleware | Purpose |
|---|---|
| **Helmet** | HTTP security headers (CSP, HSTS, X-Frame-Options) |
| **CORS** | Origin allowlist enforcement |
| **Rate Limiting** | Global + AI-specific rate limits with configurable windows |
| **Input Sanitization** | XSS and injection prevention on all inputs |
| **Request Deduplication** | Prevents duplicate concurrent requests |
| **Request Timing** | Request duration logging and monitoring |
| **Auth** | Supabase JWT verification on protected routes |
| **Admin** | Role-based admin access control |
| **SSRF Protection** | Blocks internal network requests |

### Row Level Security (RLS)

All user-facing tables enforce `auth.uid() = user_id` policies, ensuring users can only access their own data.

### Content Security Policy

The frontend enforces a strict CSP with:
- Allowlisted script/style sources
- NVIDIA NIM, GitHub, Supabase, and Railway backend in `connect-src`
- `frame-ancestors: none` to prevent clickjacking
- `upgrade-insecure-requests` for production

---

## Deployment

### Frontend (Vercel)

```bash
cd Orin-Frontend
vercel deploy --prod
```

Or via GitHub Actions on push to `main`.

**Vercel Settings:**
- Framework: Next.js
- Root Directory: `Orin-Frontend`
- Build Command: `npm run build`
- Output Directory: `.next`

### Backend (Railway)

```bash
cd Backend-server
railway deploy
```

Uses the included `Dockerfile` with multi-stage build:
1. **Builder stage:** `npm install` + `tsc` compilation
2. **Production stage:** `npm install --omit=dev` + copied `dist/`

**Railway Settings:**
- Health check: `/health`
- Port: 3001
- Restart policy: max 3 retries

### Docker

```bash
cd Backend-server
docker build -t orin-backend .
docker run -p 3001:3001 --env-file .env orin-backend
```

### CI/CD Pipeline

```
Push to main/develop → GitHub Actions
    ├── Lint & Typecheck
    ├── Run Tests
    ├── Build (Next.js)
    └── Deploy
        ├── Frontend → Vercel (production)
        └── Backend → Railway (Docker)
```

PRs trigger preview deployments on Vercel.

---

## Environment Variables

### Backend (`Backend-server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | Yes | `development` or `production` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NVIDIA_API_KEY` | Yes | NVIDIA NIM API key |
| `NVIDIA_BASE_URL` | No | NVIDIA API base URL |
| `GITHUB_WEBHOOK_SECRET` | No | GitHub webhook HMAC secret |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (default: 900000) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |

### Frontend (`Orin-Frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NVIDIA_API_KEY` | Yes | NVIDIA NIM API key |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `ADMIN_EMAILS` | No | Comma-separated admin email addresses |
| `SERPAPI_KEY` | No | SerpAPI key for web search |
| `GOOGLE_SEARCH_API_KEY` | No | Google Custom Search API key |

---

## Design System

### Colors

| Token | Usage |
|---|---|
| `ink` | Primary text, dark backgrounds |
| `paper` | Page backgrounds, light surfaces |
| `mist` | Secondary backgrounds, borders |
| `spark` | Primary accent, CTAs, links |
| `pulse` | Interactive states, hover |
| `ember` | Warnings, important highlights |
| `bloom` | Success states, positive indicators |

### Typography

| Role | Font | Usage |
|---|---|---|
| **Sans** | Inter | Body text, UI elements |
| **Serif** | Lora | Headings, editorial content |
| **Mono** | JetBrains Mono | Code, technical content |

### Animations

| Name | Description |
|---|---|
| `float` | Gentle floating motion for decorative elements |
| `pulseDot` | Pulsing dot for status indicators |
| `slideIn` | Slide-in transition for modals and panels |
| `shine` | Shimmer effect for loading states |
| `progressFill` | Progress bar fill animation |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Code style (formatting, semicolons, etc.)
refactor: Code refactoring
test:     Adding or updating tests
chore:    Build process or auxiliary tool changes
```

### Development Workflow

```bash
# Run type checks
cd Backend-server && npm run typecheck
cd Orin-Frontend && npm run typecheck

# Run linter
cd Orin-Frontend && npm run lint

# Run all tests
cd Backend-server && npm test
cd Orin-Frontend && npm test
```

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Orin

---

<div align="center">

**Built with care by the Orin team**

[![MIT License](https://img.shields.io/badge/License-MIT-4ade80.svg)](https://opensource.org/licenses/MIT)

</div>
