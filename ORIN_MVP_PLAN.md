# Orin MVP Plan — Grounded Against the Codebase

> Status: draft for review · Date: 2026-06-29 · Owner: SAR

This is the manifesto ("ProofChain / verifiable competence") translated into what
actually needs building, based on an audit of the current repo. It replaces vibes
with file paths.

---

## Context

**Why this doc exists:** The vision deck describes an 8-week MVP — "Connect GitHub →
AI assesses skills → generate verifiable Proof Cards with confidence + evidence →
shareable link a hiring manager can open cold." An audit of `Backend-server/` and
`Orin-Frontend/` shows that **~80% of that MVP already exists**. Building it as if
from scratch would waste weeks re-creating working systems.

The job is therefore *not* "build the assessment engine." It's closing four specific
gaps and sequencing them so a demo lands and the long-term moat starts compounding.

### One correction to the thesis (important)

The manifesto's load-bearing claim — *"cryptography makes proof unforgeable, that
changes everything"* — is the weakest link and should not drive the roadmap.

A hash/signature makes a card **tamper-evident** (it wasn't altered after issuance).
It does **not** make the underlying assessment **trustworthy**. If the AI says
"distributed-systems engineer, 0.9" and that's wrong, signing it just produces an
unforgeable record of a wrong claim.

The real trust mechanism is **issuer calibration over time** — when Orin says 0.8,
do those people actually perform at 0.8? That's the same reason a degree "works":
the institution's track record, not the paper. **Calibration is the moat. Crypto is
a 2-day feature.** The plan reflects this by deprioritizing signing and prioritizing
the calibration foundation.

---

## What already exists (do NOT rebuild)

| Capability | Where |
|---|---|
| 8-agent system incl. `skill-analysis`, `portfolio-scorer`, `verification` | `Backend-server/src/lib/ai/agents/` |
| GitHub repo fetch + auto-create proof cards | `Backend-server/src/routes/integrations.ts` → `importGitHubRepos()` |
| GitHub verify tools (`verify_github_repo`, `verify_github_user`, `analyze_code`) | `Backend-server/src/lib/ai/tools/tool-registry.ts` |
| Confidence score (7-factor heuristic, computed at read time) | `Backend-server/src/lib/confidence-score.ts` |
| Proof card type + `proof_cards` table | `Backend-server/src/lib/types.ts`; `schema.json` |
| Proof card UI + shareable/embeddable card | `Orin-Frontend/components/ProofCard.tsx`, `ShareableProofCard.tsx` |
| **Public** profile page (no auth, cold-openable) | `Orin-Frontend/app/(marketing)/[username]/page.tsx` |
| Embeddable single card | `Orin-Frontend/app/(marketing)/embed/proof/[id]/page.tsx` |
| Share to Twitter / LinkedIn / PNG download | `ShareableProofCard.tsx` |
| OAuth token storage (encrypted at rest, AES-256-GCM) | `Backend-server/src/lib/token-crypto.ts`; `user_integrations` table |
| Shareable link tokens, view analytics | `proof_shares`, `proof_views` tables |

**Implication:** the engine, the cards, the public page, and sharing are done. The
demo's failure point is upstream of all of it.

---

## The four real gaps

### Gap 1 — The "magic moment" doesn't connect (HIGHEST LEVERAGE)
Backend can import GitHub repos, but the **frontend never triggers it**. In
`app/(auth)/onboarding/page.tsx`, GitHub is a checkbox that does nothing. There is no
"Connect → 2 minutes → cards appear" path. Without this, there is no demo.

- Backend endpoint already exists: `POST /api/integrations/:provider/import`.
- Missing: a frontend trigger + a fast, low-friction entry path + a "generating…" → "done" UX.

**Open decision (flagged):** auth model —
- **(A) Full OAuth** (sign in with GitHub): private repos + commit history, richer
  signal; needs GitHub App/OAuth secrets + callback wiring.
- **(B) Public username only**: user types their handle, fetch public repos via API,
  no login; lowest friction, best for a cold 2-min demo; public data only.

Recommendation: **start with (B)** to nail the demo and frictionless funnel, add (A)
later for depth. To be confirmed before this build starts.

### Gap 2 — Confidence + evidence aren't persisted
Confidence is recomputed at read time and there is **no evidence chain** stored on a
card (which tool verified what, which commit proved which skill). The manifesto's
"evidence backing it" pillar is currently thin strings (`what_it_proves[]`).

- Add a persisted `confidence` + structured `evidence` shape to proof cards
  (store the breakdown from `confidence-score.ts` + which agent/tool produced it).
- Likely a `metadata` JSONB extension first (no migration), promoted to columns later.

### Gap 3 — Calibration foundation (THE MOAT — invisible but compounding)
No `hiring_outcomes`, no feedback loop. Nothing captures whether a card's prediction
matched reality. This is what makes companies eventually trust Orin over LinkedIn.

- New tables: `hiring_outcomes` (proof/user → outcome + employer feedback),
  optionally `calibration_runs` (per-confidence-bucket accuracy over time).
- Minimal capture UI/endpoint; it only pays off once beta users generate data, so
  **build the pipes now, harvest later**.

### Gap 4 — Signing / hashing (LOWEST PRIORITY)
Proof cards are unsigned DB rows. Per the thesis correction above, this is a
nice-to-have for tamper-evidence, **not** the trust mechanism. Defer until after 1–3.

---

## Sequenced plan

### Phase 0 — Decide GitHub auth model (½ day)
Confirm (A) OAuth vs (B) public-username for the first cut of Gap 1. Everything in
Phase 1 depends on this.

### Phase 1 — Wire the magic moment (Week 1–2) · *Gap 1*
- Frontend entry: a fast "Connect GitHub" action (landing/onboarding) that triggers
  import via the **existing** `POST /api/integrations/:provider/import`.
- "Generating…" → cards-appear UX; reuse `ProofCardSkeleton.tsx`.
- Make onboarding's GitHub selection actually call the import (remove the dead checkbox).
- Files: `app/(auth)/onboarding/page.tsx`, a new connect component, frontend API
  route under `app/api/` proxying to backend via `app/api/_lib/forward.ts`.
- **Exit criteria:** a logged-in (or username-only) user goes from "connect" to
  populated, verified proof cards in under ~2 minutes, no manual entry.

### Phase 2 — Persist confidence + evidence (Week 3) · *Gap 2*
- Extend proof card creation in `importGitHubRepos()` to store confidence breakdown
  + evidence chain (tool used, source commit/repo, extracting agent) in `metadata`.
- Surface evidence in `ProofCard.tsx` / `ShareableProofCard.tsx` ("Verified via X · proven by commit Y").
- **Exit criteria:** every generated card is self-justifying without a re-computation pass.

### Phase 3 — Calibration pipes (Week 4) · *Gap 3*
- Migration: `hiring_outcomes` (+ optional `calibration_runs`) in
  `Orin-Frontend/supabase/migrations/`; update `schema.json`.
- Minimal endpoint + capture point (e.g., recruiter/owner can confirm an outcome).
- **Exit criteria:** an outcome can be recorded against a card; a query can later
  compute "when confidence=0.8, observed success rate = ?".

### Phase 4 — Beta polish (Week 5–6)
- QR code on `ShareableProofCard.tsx` (currently missing).
- Tighten the cold-open public page; the recruiter-facing read is the product surface.
- Optional: Gap 4 signing if time allows.

### Phase 5 — Beta launch (Week 7–8)
- 10 → 100 Indian developers. Run import on their GitHub, generate cards, collect
  feedback on **assessment accuracy** and **hiring-manager trust** (not card design).
- Instrument the calibration loop from Phase 3 against real reactions.

---

## What to measure (so we optimize the right thing)
- **Funnel:** connect → cards-generated → shared. (Is the magic moment real?)
- **Calibration:** does stated confidence track observed outcomes? (Is the moat real?)
- Ignore the vision-deck revenue table operationally — it'll bias toward vanity metrics.

---

## Verification (per phase)
Run from the relevant package dir (no monorepo tooling — `cd` first).

- Types first: `cd Backend-server && npm run typecheck` · `cd Orin-Frontend && npm run typecheck`
- Lint (frontend): `cd Orin-Frontend && npm run lint`
- Tests: `npm test` in each package.
- **Phase 1 end-to-end:** `npm run dev` in both packages (backend 3001, frontend 3000),
  walk connect → generate → view cards → open public `[username]` page in a logged-out
  browser, confirm cold-open works.
- DB changes: validate migration locally before remote; keep `schema.json` in sync.
- Remember: backend relative imports need `.js`; backend strict TS forbids unused vars.

---

## Open questions to resolve before coding
1. **GitHub auth model** — OAuth (A) or public-username (B) for the first cut? *(blocks Phase 1)*
2. Demo entry point — fully public funnel (no signup) or post-signup onboarding?
3. Calibration capture — who confirms an outcome (self-report, recruiter, both)?
