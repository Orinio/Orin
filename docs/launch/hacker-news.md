# Hacker News — Show HN Post

## Title
Show HN: Orin — Turn Work Into Career Proof (AI-powered career platform with 8 agents)

## URL
https://orin.app

## Body

I built Orin because I was frustrated with how broken developer hiring is.

**The problem:** Resumes lie. GitHub profiles are hard to read. Portfolios are outdated. Recruiters can't tell who actually built what.

**The solution:** Proof Cards — verified, shareable achievements created from your actual work.

### How it works:
1. Connect your GitHub, Kaggle, LinkedIn, or certificates
2. Orin's AI analyzes your work and creates Proof Cards
3. Each card is verified against the source (GitHub API, certificate checksums)
4. Share your proof profile — every skill backed by real proof

### The tech:
- **8 specialized AI agents** (chat, coach, skill analysis, opportunity matching, learning path, portfolio scoring, verification, safety)
- **Persistent memory** — AI remembers your goals, skills, and progress across sessions
- **Real-time streaming** — Claude-inspired chat with visual output (charts, diagrams, dashboards)
- **20+ tools** — web search, GitHub verification, code analysis, skill extraction
- **NVIDIA NIM API** — Qwen 3.5 397B for chat, Qwen 3 Coder 480B for coaching

Stack: Next.js 16, React 19, Supabase, Express, NVIDIA NIM, Vitest, Docker.

### What makes it different:
- Not another resume builder or job board
- Verification is cryptographic, not self-reported
- The AI actually takes actions (saves goals, tracks applications, generates resume bullets)
- Public profiles are SEO-optimized and embeddable

Try it free at https://orin.app

Happy to answer any questions about the architecture, AI system, or design decisions.
