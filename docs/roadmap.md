# Product Roadmap — Saju AI App

> Version 1.0 | Status: Planning | Last Updated: 2026-05-12

---

## Vision

To become the most trusted AI-powered human pattern analysis platform in Korea, grounded in the 3,000-year tradition of Saju-Myeongri, and eventually the leading framework for culturally-rooted personality and timing analysis in East Asia.

---

## Release Schedule

```
2026 Q2     2026 Q3     2026 Q4     2027 Q1     2027 Q2     2027 Q3+
─────────── ─────────── ─────────── ─────────── ─────────── ───────────
  v0.1        v1.0        v1.1        v1.2        v1.3        v2.0
 Foundation   MVP         AI Chat   Compatibility Business   Platform
   (Eng.)    Launch     + Premium    Analysis    Timing
```

---

## Phase 0 — Foundation (v0.1, Weeks 1–5)

**Goal:** A working Saju Engine with full test coverage. No user-facing product yet.

| Deliverable | Description |
|---|---|
| Saju Engine module | Pure TypeScript: Four Pillars, Five Elements, Ten Gods, Luck Cycles |
| Lunar↔Solar converter | Lookup table 1930–2060 with 200+ test cases |
| Solar term table | Seeded in Supabase, accurate to ±1 minute |
| Engine test suite | 100% coverage on all calculation functions |
| CI pipeline | GitHub Actions: lint, type-check, tests |

**Success criteria:** All 200+ known Saju test cases pass. Engine reviewed by one traditional practitioner.

---

## Phase 1 — MVP Launch (v1.0, Weeks 6–12)

**Goal:** Publicly available product that can take birth data and return an AI report.

| Feature | Description | Tier |
|---|---|---|
| User auth | Email + Google + Kakao | Free |
| Birth input form | Date, time, gender, solar/lunar | Free |
| Four Pillars display | Visual pillar grid with stems/branches | Free |
| Five Elements chart | Radar + bar chart | Free |
| Ten Gods table | With hover explanations | Free |
| AI full report | 7-section interpretation, streamed | Free (1/month) |
| Profile save | 1 profile for free users | Free |
| Luck cycle timeline | 8 cycles + current year overlay | Free |

**KPIs at launch:** 500 signups in first 30 days, 60% complete report generation, < 5% error rate on AI reports.

---

## Phase 2 — AI Chat + Premium (v1.1, ~2026 Q4)

**Goal:** Introduce the AI consultation feature and paid subscription.

| Feature | Description | Tier |
|---|---|---|
| AI Chat Consultation | Context-aware chat using user's chart | Premium |
| Unlimited profiles | Save up to 20 profiles | Pro |
| Unlimited AI reports | No monthly cap | Pro |
| Report PDF export | Download and share | Pro |
| Yearly deep report | Focused세운 analysis for selected year | Pro |
| Subscription billing | Stripe + Toss Payments integration | — |
| Prompt management UI | Admin dashboard for template editing | Admin |

**KPIs:** 5% free→Pro conversion, ≥ 4.2/5 report quality rating, < $0.08 average cost per report.

---

## Phase 3 — Compatibility Analysis (v1.2, ~2027 Q1)

**Goal:** Add the most-requested feature: 궁합 (relationship compatibility).

| Feature | Description | Tier |
|---|---|---|
| Two-person compatibility | Enter a second person's birth data | Premium |
| Compatibility score | 1–10 with multi-dimensional breakdown | Premium |
| Interaction analysis | Ten Gods interaction between two charts | Premium |
| Shareable compatibility card | Visual summary for social sharing | Premium |
| Family profiles | Group related profiles | Pro |

**KPIs:** Viral sharing rate ≥ 15% of compatibility reports, 30% of active Pro users use compatibility feature weekly.

---

## Phase 4 — Business & Timing Analysis (v1.3, ~2027 Q2)

**Goal:** Unlock the B2B/professional use case.

| Feature | Description | Tier |
|---|---|---|
| Business timing report | Career change, investment, launch timing | Premium |
| Monthly flow analysis | 12-month breakdown per year | Premium |
| Decision-support mode | User inputs a decision; AI evaluates timing | Premium |
| Practitioner dashboard | Tools for professional Saju consultants | Enterprise |
| Client management | Consultants manage multiple client profiles | Enterprise |
| Branded reports | White-labeled PDF for practitioners | Enterprise |

**KPIs:** ≥ 50 practitioner accounts, average Premium revenue per user > ₩25,000/month.

---

## Phase 5 — Platform (v2.0, ~2027 Q3+)

**Goal:** Transform from a product into a platform.

| Feature | Description |
|---|---|
| Public API | REST API with developer docs for third-party integrations |
| Webhook system | Notify external systems on report completion |
| Custom prompt builder | Pro users can adjust report focus |
| Daily AI briefings | Morning personalized daily fortune brief (push / email) |
| Voice consultation | TTS/STT AI consultation session |
| Multi-language | English, Traditional Chinese, Japanese |
| React Native app | iOS + Android native experience |
| Cohort analytics | Aggregate anonymized patterns (opt-in) |

---

## Feature Backlog (Unscheduled)

| Feature | Priority | Notes |
|---|---|---|
| Saju-based team analysis | Medium | HR/team building use case |
| Investment timing overlay | Medium | Financial market calendar integration |
| Naming analysis (작명) | Low | Birth name element analysis |
| Dream interpretation | Low | Complementary product |
| Offline mode | Low | Cache last report for no-network access |
| Smart watch companion | Low | Daily briefing on wearables |
| Education mode | Medium | Teach users Saju principles interactively |

---

## Technology Upgrade Path

| Milestone | Technology Change |
|---|---|
| v1.1 | Add Upstash Redis for rate limit + report caching |
| v1.2 | Add Supabase Realtime for live chat delivery |
| v1.3 | Migrate to edge runtime for API routes (Vercel Edge) |
| v2.0 | Evaluate dedicated Saju calculation microservice if > 10k DAU |
| v2.0 | Add pgvector for semantic search over saved reports |
| v2.0 | Evaluate self-hosted LLM fine-tuned on Saju corpus |

---

## Admin Tools Roadmap

| Tool | Phase | Description |
|---|---|---|
| Prompt template editor | v1.1 | Create/edit/activate AI prompt templates |
| A/B prompt testing | v1.1 | Split traffic between prompt versions |
| User analytics dashboard | v1.0 | Signups, reports, conversion funnel |
| Interpretation quality review | v1.1 | Flag and review AI reports below rating threshold |
| Payment analytics | v1.1 | MRR, churn, upgrade/downgrade tracking |
| Error monitoring | v1.0 | Sentry integration, alert routing |
| Usage cap management | v1.0 | Override per-user limits |
| Content moderation | v1.1 | Flag chat messages for review |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Saju calculation errors discovered post-launch | Medium | High | Immutable engine versioning; practitioner review pre-launch |
| AI hallucination in reports | Medium | High | JSON schema validation; clear disclaimers in UI |
| AI API cost overrun | Medium | Medium | Token budgets, caching, model tiering |
| Low report quality (user complaints) | Medium | High | Beta test with 20 users; rating system for feedback loop |
| Lunar calendar edge cases | Low | Medium | 200+ test cases; KARI data validation |
| Korean cultural sensitivity | Medium | Medium | Avoid fatalistic language; focus on patterns not predictions |
| Competitor with more Saju knowledge | Medium | Medium | Own the AI/UX moat; build practitioner community |
| Supabase service disruption | Low | High | Automated daily backups; disaster recovery runbook |
