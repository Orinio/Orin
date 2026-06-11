# Orin Product Vision

## One-Liner

**A verified proof layer for student talent, with AI that turns evidence into career action.**

## The Problem

Students have scattered work — GitHub repos, certificates, competition results, project deployments — but no trusted way to present it to recruiters. Resumes lie. Portfolios are outdated. LinkedIn recommendations are politeness.

Meanwhile, the market is shifting:
- 39% of core skills will change by 2030 (McKinsey)
- Skills-based hiring is more predictive than education-based hiring
- Students are uneasy about AI in recruiting due to authenticity concerns
- Digital credentials and wallets have real demand from jobseekers

## The Solution

Orin is a **verified proof layer** that:

1. **Connects** scattered work (GitHub, certificates, Kaggle, projects)
2. **Verifies** each claim against the source (API checks, checksums)
3. **Generates** clean, portable Proof Cards with confidence scores
4. **Shows** skill gaps and actionable 1-2 week plans
5. **Shares** proof with recruiters via embeddable cards and public profiles

## Core Product: Proof Wallet

The first sharp value is the **Proof Wallet**:

```
┌─────────────────────────────────────────────────────────────┐
│                     PROOF WALLET                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   GitHub     │  │  Certificate │  │   Kaggle     │      │
│  │   12 repos   │  │   3 certs    │  │   2 notebooks│      │
│  │   verified ✓ │  │   verified ✓ │  │   verified ✓ │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              VERIFIED PROFILE                         │  │
│  │                                                        │  │
│  │  Skills: React (95%), Python (88%), SQL (72%)         │  │
│  │  Confidence: 87% average across all proofs            │  │
│  │  Sources: 15 verified, 2 pending                      │  │
│  │                                                        │  │
│  │  [View Proof Cards]  [Share Profile]  [Export PDF]    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SKILL GAP ENGINE                         │  │
│  │                                                        │  │
│  │  Target Role: Frontend Developer                      │  │
│  │  Missing: TypeScript (-15%), Testing (-20%)           │  │
│  │                                                        │  │
│  │  Action Plan (2 weeks):                               │  │
│  │  Week 1: Complete TypeScript course (8 hours)         │  │
│  │  Week 2: Add tests to 2 projects (6 hours)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Product Shape (Build Order)

### Phase 1: Proof Wallet ✓ (built)
- Connect GitHub, certificates, Kaggle
- Auto-generate verified profile
- Basic proof cards with source links

### Phase 2: Skill Gap Engine (next)
- Show what user is missing for target role
- 1-2 week action plans (not generic advice)
- Progress tracking against goals

### Phase 3: Proof-Aware Coach
- AI reads proof wallet
- Gives concrete next steps based on actual gaps
- References specific proofs in advice

### Phase 4: University Dashboard (B2B)
- Career services can track student outcomes
- Bulk verification for student cohorts
- Analytics on skill development

### Phase 5: Employer Search (later)
- Only after student-side trust exists
- Recruiters search verified profiles
- Contact through platform

## Wedge Market

Start with one of these:
- CS students in colleges
- Bootcamp graduates
- Students applying for internships
- Students with GitHub/Kaggle/certificates already online

These users already have proof fragments to connect.

## What Makes Orin Different

| Generic Career Platform | Orin |
|------------------------|------|
| Self-reported skills | Cryptographically verified |
| Generic AI coaching | Proof-aware coaching |
| Resume builder | Portable proof cards |
| Job board | Skill gap engine |
| LinkedIn clone | Trusted credential layer |

## Key Metrics

1. **Trust**: Every claim traces back to a source
2. **Actionability**: Every profile ends with "what to do next"
3. **Distribution**: Every proof card is shareable and recruiter-friendly

## Target Users

### Primary: Students with Existing Proof
- Have GitHub repos, certificates, or competition results
- Want to present skills credibly to recruiters
- Need to know what to learn next

### Secondary: University Career Services
- Need scalable career guidance
- Want trusted student outcomes data
- Looking for AI tools that support (not replace) their role

### Tertiary: Recruiters (later)
- Want verified skill claims
- Need to assess candidates faster
- Looking for talent with portable credentials

## Success Criteria

Orin succeeds when:
1. A student can share a Proof Card that a recruiter trusts
2. The Proof Card traces back to verified sources
3. The student knows exactly what to learn next
4. University career services can track outcomes at scale
