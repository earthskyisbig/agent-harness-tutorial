# Project Plan — Saju AI App

> Version 1.0 | Status: Planning | Last Updated: 2026-05-12

---

## 1. Project Overview

**Saju AI App** is an AI-powered human pattern analysis and decision-support platform grounded in Korean Saju-Myeongri (사주명리학) principles. It moves beyond traditional fortune-telling to deliver structured, data-driven personality insights, behavioral tendencies, and timing analysis that users can apply to career, relationships, and life decisions.

The platform separates two concerns strictly:

1. **Deterministic Saju Engine** — mathematically calculates the Four Pillars, Five Elements, and Ten Gods from birth data with no ambiguity.
2. **AI Interpretation Layer** — receives structured JSON output from the engine and generates nuanced, contextual reports using LLM APIs.

This separation guarantees calculation correctness while giving the AI room to provide rich, human-readable interpretations.

---

## 2. Target Users

| Segment | Description | Motivation |
|---|---|---|
| **Self-discovery seekers** | 25–45 yr, urban professionals | Understand personality patterns, life tendencies |
| **Decision-support users** | Career changers, entrepreneurs | Timing analysis for major life moves |
| **Relationship analysts** | Couples, HR professionals | Compatibility and interpersonal dynamics |
| **Saju practitioners** | Traditional consultants | Digital tool to augment consultations |
| **Wellness & coaching** | Life coaches, therapists | Supplement frameworks with pattern data |

---

## 3. MVP Scope

### In Scope (MVP)
- User registration and authentication
- Birth data input (date, time, gender, solar/lunar calendar)
- Lunar↔Solar calendar conversion
- Four Pillars calculation (년주, 월주, 일주, 시주)
- Five Elements analysis (오행 분포)
- Ten Gods identification (십성)
- Basic luck cycles display (대운)
- AI-generated interpretation report (text)
- Report save and retrieval
- Korean-language UI

### Out of Scope (MVP)
- Compatibility analysis
- Business/investment timing
- AI chat consultation
- Voice consultation
- Daily briefings
- Payment / subscription

---

## 4. Feature Priorities

| Priority | Feature | Rationale |
|---|---|---|
| P0 | Saju engine (calculation) | Everything depends on this |
| P0 | Lunar↔Solar conversion | Required for accurate pillars |
| P0 | Four Pillars display | Core user value |
| P0 | AI report generation | Differentiator |
| P1 | User auth + profile save | Retention |
| P1 | Five Elements chart | Visual comprehension |
| P1 | Ten Gods table | Practitioner appeal |
| P2 | Luck cycles timeline | Decision support |
| P2 | Multiple profiles per user | Family use |
| P3 | Chat consultation | Premium feature |
| P3 | Compatibility analysis | Premium feature |
| P3 | Export PDF | Premium feature |

---

## 5. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                 Next.js + TailwindCSS + TypeScript            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                   Next.js API Routes / Edge                   │
│              (Route Handlers — /api/*)                        │
│                                                               │
│   ┌─────────────────┐    ┌──────────────────────────────┐   │
│   │  Saju Engine    │    │   AI Interpretation Service   │   │
│   │  (Pure TS)      │───▶│   (Claude / OpenAI)           │   │
│   │  /saju-engine   │    │   /backend/ai                 │   │
│   └─────────────────┘    └──────────────────────────────┘   │
│            │                          │                       │
│            ▼                          ▼                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 Supabase (PostgreSQL)                 │   │
│   │    Auth · Users · Profiles · Interpretations · Logs  │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** The Saju Engine is a pure TypeScript module with zero external dependencies. It receives birth data, returns a fully structured `SajuChart` JSON object. The AI layer only ever reads from that JSON — it never performs Saju calculations.

---

## 6. Backend Structure

```
backend/
├── api/
│   ├── saju/
│   │   ├── calculate.ts       # POST /api/saju/calculate
│   │   └── profile.ts         # CRUD saju profiles
│   ├── interpretation/
│   │   ├── generate.ts        # POST /api/interpretation/generate
│   │   └── retrieve.ts        # GET  /api/interpretation/:id
│   ├── chat/
│   │   └── message.ts         # POST /api/chat/message  (v2)
│   └── auth/
│       └── [...nextauth].ts   # Supabase Auth integration
├── services/
│   ├── supabase.ts            # Supabase client singleton
│   ├── ai-client.ts           # Claude/OpenAI abstraction
│   └── lunar-converter.ts     # Lunar↔Solar bridge
├── middleware/
│   ├── auth-guard.ts          # JWT validation
│   ├── rate-limiter.ts        # Per-user rate limits
│   └── request-logger.ts
└── types/
    ├── saju.ts                # SajuChart, Pillar, Element types
    ├── interpretation.ts      # Report types
    └── api.ts                 # Request/response envelopes
```

---

## 7. Frontend Structure

```
app/
├── (public)/
│   ├── page.tsx               # Landing page
│   ├── about/page.tsx
│   └── pricing/page.tsx
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/
│   ├── dashboard/page.tsx     # User's saved profiles
│   ├── new/page.tsx           # Birth data input form
│   ├── chart/[id]/
│   │   ├── page.tsx           # Full chart + report view
│   │   ├── elements/page.tsx  # Five Elements deep-dive
│   │   └── luck/page.tsx      # Luck cycles timeline
│   └── chat/[id]/page.tsx     # AI consultation (v2)
├── components/
│   ├── saju/
│   │   ├── PillarGrid.tsx     # 四柱 visual grid
│   │   ├── ElementChart.tsx   # Five Elements radar/bar
│   │   ├── TenGodsTable.tsx
│   │   └── LuckCycleBar.tsx
│   ├── forms/
│   │   ├── BirthInputForm.tsx
│   │   └── CalendarToggle.tsx
│   ├── report/
│   │   ├── ReportCard.tsx
│   │   └── StreamingText.tsx  # Streamed AI output
│   └── ui/                    # shadcn/ui or custom primitives
└── lib/
    ├── api-client.ts
    ├── format-saju.ts
    └── i18n.ts                # Korean / English strings
```

---

## 8. AI Interpretation Pipeline

```
Birth Data
    │
    ▼
[Saju Engine]  ──▶  SajuChart JSON
    │                    │
    │                    ▼
    │         [Prompt Builder]
    │         ├─ System prompt (role + rules)
    │         ├─ Structured chart data (JSON)
    │         ├─ Analysis focus (personality / career / relationship)
    │         └─ Output schema instructions
    │                    │
    │                    ▼
    │          [Claude / OpenAI API]
    │                    │
    │                    ▼
    │          [Response Validator]  ◀─ reject if schema mismatch
    │                    │
    ▼                    ▼
Saved to DB ◀──  InterpretationReport JSON
                         │
                         ▼
               Streamed to Frontend
```

**Hallucination prevention rules:**
- All calculations happen before AI is invoked — AI never computes.
- Prompts include explicit instructions: "Do not invent or modify the chart data provided."
- AI output is structured JSON; a validator checks field completeness before saving.
- Chart data is embedded verbatim in the prompt — AI only narrates, not derives.

---

## 9. Saju Calculation Engine Design

The engine is a pure functional module. All state is derived from inputs; no global mutable state.

```typescript
interface BirthData {
  year: number;       // Gregorian year
  month: number;
  day: number;
  hour: number;       // 0–23, local Korean Standard Time
  minute: number;
  gender: 'male' | 'female';
  isLunar: boolean;
  isLeapMonth?: boolean;
}

interface SajuChart {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar;
  dayMaster: HeavenlyStem;
  elementDistribution: ElementDistribution;
  tenGods: TenGodsMap;
  luckCycles: LuckCycle[];
  yearlyFlow: YearlyFlow[];
  balance: BalanceAnalysis;
}
```

**Calculation steps:**
1. Convert Lunar → Solar if needed (using lookup table + algorithm)
2. Determine the solar term boundary for the birth month
3. Compute Year Pillar from Gregorian year
4. Compute Month Pillar from solar term
5. Compute Day Pillar from Julian Day Number algorithm
6. Compute Hour Pillar from KST hour
7. Derive Five Elements distribution
8. Derive Ten Gods relative to Day Master
9. Compute Luck Cycles (대운) from Month Pillar + gender + solar term distance

---

## 10. Database Strategy

- **Supabase** as the managed PostgreSQL provider with built-in Auth.
- Row-Level Security (RLS) enabled on all user-facing tables.
- Master/reference tables (stems, branches, solar terms) are read-only and cached in memory at startup.
- Interpretations are stored as JSONB for schema flexibility across model versions.
- Full-text search on interpretation content via PostgreSQL `tsvector`.

See `docs/database_schema.md` for full DDL.

---

## 11. Security Considerations

| Concern | Mitigation |
|---|---|
| Auth bypass | Supabase JWT + RLS on every table |
| Prompt injection | User input never inserted into system prompts; only structured JSON |
| AI API key exposure | Keys stored in Vercel env vars; never sent to client |
| Rate abuse | Per-user rate limit on `/api/interpretation/generate` (5 req/hr free tier) |
| Data privacy | Birth data stored encrypted at rest; GDPR-aware deletion endpoint |
| SSRF | Outbound requests only to whitelisted AI provider endpoints |
| XSS | Next.js default escaping; dangerouslySetInnerHTML never used |
| SQL injection | All queries via Supabase SDK parameterized queries |

---

## 12. Monetization Strategy

### Free Tier
- 1 Saju profile saved
- 1 AI interpretation report per month
- Basic Four Pillars + Five Elements view

### Pro (₩9,900/month)
- Unlimited profiles
- Unlimited AI reports
- Ten Gods analysis
- Luck cycle timeline
- Report PDF export

### Premium (₩24,900/month)
- Everything in Pro
- AI chat consultation (20 messages/month)
- Compatibility analysis (2 per month)
- Business timing reports
- Priority generation queue

### Enterprise / API
- White-label API access
- Custom prompt templates
- Volume pricing
- SLA support

---

## 13. Deployment Strategy

| Environment | Platform | Purpose |
|---|---|---|
| Development | Local Next.js dev server | Feature development |
| Preview | Vercel Preview Deployments | PR review, QA |
| Staging | Vercel (staging branch) | Pre-release validation |
| Production | Vercel (main branch) | Live users |

**Infrastructure:**
- **Vercel** — Next.js hosting, edge functions, environment secrets
- **Supabase** — Managed PostgreSQL, Auth, Realtime
- **Upstash Redis** (future) — Rate limiting, caching
- **Sentry** — Error tracking
- **PostHog** — Product analytics

**CI/CD:**
- GitHub Actions on PR: lint → type-check → unit tests → E2E (Playwright)
- Merge to main → auto-deploy to production via Vercel

---

## 14. Development Milestones

### Phase 0 — Foundation (Week 1–2)
- [ ] Project scaffolding (Next.js + TS + Tailwind)
- [ ] Supabase project setup + schema migration
- [ ] Auth flow (email + social)
- [ ] CI/CD pipeline

### Phase 1 — Saju Engine (Week 3–5)
- [ ] Lunar↔Solar converter with test suite
- [ ] Four Pillars calculator
- [ ] Five Elements distribution
- [ ] Ten Gods derivation
- [ ] Luck Cycles computation
- [ ] 100% coverage of known test cases

### Phase 2 — API Layer (Week 6–7)
- [ ] `/api/saju/calculate` endpoint
- [ ] `/api/interpretation/generate` with Claude/OpenAI
- [ ] Rate limiting + auth middleware
- [ ] Prompt v1 + JSON schema validator

### Phase 3 — Frontend MVP (Week 8–10)
- [ ] Birth input form (lunar/solar toggle)
- [ ] Four Pillars grid component
- [ ] Five Elements chart
- [ ] AI report display with streaming
- [ ] Dashboard (saved profiles)

### Phase 4 — QA + Launch (Week 11–12)
- [ ] Cross-browser testing
- [ ] Edge case saju test cases
- [ ] Performance profiling
- [ ] Korean copy review
- [ ] Beta user testing (20 users)
- [ ] Production launch

---

## 15. Future Expansion Strategy

| Feature | Timeline | Revenue Impact |
|---|---|---|
| AI Chat Consultation | v1.1 | High — core premium hook |
| Compatibility Analysis (궁합) | v1.2 | High — viral sharing |
| Business Timing Reports | v1.3 | Medium — B2B segment |
| Daily/Weekly AI Briefings | v1.4 | High — retention driver |
| Investment Timing Analysis | v1.5 | High — premium pricing |
| Voice Consultation (TTS/STT) | v2.0 | High — accessibility |
| Practitioner Dashboard | v2.0 | Medium — B2B2C |
| API White-labeling | v2.1 | High — enterprise |
| Mobile App (React Native) | v2.2 | Medium — reach |
| Multi-language (EN, ZH, JA) | v2.3 | Medium — global |
