# MVP Checklist — Saju AI App

> Version 1.0 | Status: Planning | Last Updated: 2026-05-12

---

## How to Use This Checklist

- Each item represents a testable, shippable unit of work.
- Items are ordered by dependency — complete earlier items first.
- Mark `[x]` when the item is done AND verified (not just coded).
- A milestone is "done" only when every item in it is checked.

---

## Milestone 0 — Project Foundation

### Infrastructure Setup
- [ ] Next.js 14+ app initialized with TypeScript strict mode
- [ ] TailwindCSS configured with custom element color tokens
- [ ] ESLint + Prettier configured and passing
- [ ] Husky pre-commit hooks: lint + type-check
- [ ] Supabase project created (dev + prod environments)
- [ ] Supabase local development configured (`supabase start`)
- [ ] Environment variable schema defined and validated at startup (zod)
- [ ] Vercel project linked to repository
- [ ] GitHub Actions CI: lint → type-check → unit tests (passing on empty suite)
- [ ] GitHub Actions CD: auto-deploy to preview on PR

### Authentication
- [ ] Supabase Auth configured (email/password)
- [ ] Google OAuth configured
- [ ] Kakao OAuth configured (Korean user base priority)
- [ ] Login page (`/login`) built and functional
- [ ] Signup page (`/signup`) built and functional
- [ ] Auth middleware protecting `/dashboard`, `/new`, `/chart/*`
- [ ] Session persistence (refresh tokens) working
- [ ] "Forgot password" flow working
- [ ] User profile row created automatically on signup (DB trigger)

---

## Milestone 1 — Saju Engine

### Core Engine (saju-engine/)
- [ ] `HeavenlyStem` and `EarthlyBranch` constants defined and exported
- [ ] `SixtyGapja` lookup table complete (all 60 entries)
- [ ] Hidden stems (지장간) table complete for all 12 branches
- [ ] `yearPillar()` function implemented
- [ ] `monthPillar()` function implemented (solar term lookup)
- [ ] `dayPillar()` function implemented (Julian Day Number method)
- [ ] `hourPillar()` function implemented
- [ ] `elementDistribution()` function implemented (stems + hidden stems)
- [ ] `deriveTenGod()` function implemented for all 10 relationships
- [ ] `luckCycleStartAge()` function implemented
- [ ] `generateLuckCycles()` function implemented (8 cycles)
- [ ] `yearlyFlow()` function implemented
- [ ] Full `calculateSajuChart()` orchestrator function

### Lunar Conversion
- [ ] `lunar_calendar` reference table seeded (1930–2060 minimum)
- [ ] `solar_terms` reference table seeded (1930–2060 minimum)
- [ ] `lunarToSolar()` function implemented (lookup + edge cases)
- [ ] `solarToLunar()` function implemented (for reverse display)
- [ ] Leap month (윤달) correctly handled in both directions

---

## Milestone 2 — Testing (Engine)

### Unit Tests (tests/)
- [ ] Year Pillar: 20 known test cases pass (various decades)
- [ ] Month Pillar: Solar term boundary cases (birth on exact day of term)
- [ ] Day Pillar: 30 known birth dates with verified day gapja
- [ ] Hour Pillar: All 12 시 (hour) boundaries
- [ ] Five Elements: Verify distribution sums to correct total
- [ ] Ten Gods: All 10 derivation cases covered
- [ ] Luck Cycles: Yang male vs Yin female direction verified
- [ ] Luck Cycle start age: 3 known cases verified against reference
- [ ] Lunar↔Solar: 200 known pairs from KARI data
- [ ] Leap month edge cases: 5 specific윤달 dates
- [ ] Timezone: Birth at midnight (23:59 vs 00:00 boundary)
- [ ] Year boundary: Birth before Ipchun (e.g., 1990-01-15 = 1989 Saju year)
- [ ] Ipchun exact moment: Birth within 1 hour of Ipchun

---

## Milestone 3 — API Layer

### Saju API
- [ ] `POST /api/saju/calculate` — accepts BirthData, returns SajuChart JSON
- [ ] Input validation (zod schema) on all fields
- [ ] Lunar conversion called automatically when `isLunar = true`
- [ ] Result saved to `saju_profiles` table
- [ ] Returns existing profile if same user + identical birth data exists
- [ ] Auth guard: unauthenticated users blocked (401)

### Interpretation API
- [ ] `POST /api/interpretation/generate` — triggers AI report generation
- [ ] Fetches active `prompt_template` for `report_type`
- [ ] Injects SajuChart JSON into prompt (no raw user text in system prompt)
- [ ] Calls Claude API (claude-sonnet-4-6) with streaming enabled
- [ ] Streams response via SSE to client
- [ ] Validates AI JSON response against output schema
- [ ] Retry up to 2 times on schema validation failure
- [ ] Saves completed interpretation to `interpretations` table
- [ ] Rate limiting: 5 generations/hour for free tier
- [ ] Rate limiting: 30 generations/hour for pro tier
- [ ] `GET /api/interpretation/[id]` — returns saved interpretation
- [ ] Cache hit: returns existing interpretation if chart + type unchanged

### Usage Tracking
- [ ] Usage event logged for each interpretation generated
- [ ] Free tier gate: block after 1 interpretation/month

---

## Milestone 4 — Frontend (MVP UI)

### Forms
- [ ] `BirthInputForm` component with all fields
- [ ] Lunar / solar toggle updates month selector behavior
- [ ] Leap month checkbox appears only when 음력 + known leap month year
- [ ] Time picker shows Korean 시 labels alongside clock times
- [ ] "시간 모름" option wired correctly (sets hour=12)
- [ ] Client-side validation with Korean error messages
- [ ] Submit triggers loading state + redirect on success

### Chart View
- [ ] `PillarGrid` renders all four pillars with stems + branches + ten gods
- [ ] Element color coding applied consistently
- [ ] `ElementBar` shows five-element distribution with percentages
- [ ] Element balance (신강/신약) indicator displayed
- [ ] Tab navigation: 사주 차트 / 오행 분석 / 대운 흐름 / AI 보고서

### Five Elements View
- [ ] `ElementRadarChart` renders correctly
- [ ] Hidden stems (지장간) table displayed
- [ ] Generating / Controlling cycle diagram with user's elements highlighted

### Luck Cycles View
- [ ] `LuckCycleTimeline` renders 8 cycles on horizontal bar
- [ ] Current cycle visually distinguished ("현재")
- [ ] Next 5 years of 세운 shown as overlay
- [ ] Hover tooltip shows pillar detail

### AI Report View
- [ ] "보고서 생성" CTA card shown when no report exists
- [ ] Streaming text renders sections progressively via SSE
- [ ] Each section: title, content, highlights, cautions
- [ ] Error state handled gracefully ("생성 중 오류가 발생했습니다")
- [ ] Regenerate button (for pro users)
- [ ] Share button copies link to clipboard

### Dashboard
- [ ] Profile grid shows saved profiles
- [ ] Each card shows 일간 + summary + last report date
- [ ] "새 사주 추가" card shown
- [ ] Free tier limit message when at cap (1 profile)

### Landing Page
- [ ] Hero section with CTA
- [ ] Feature highlights section
- [ ] Sample/demo section
- [ ] Pricing preview
- [ ] Links to `/signup` and `/login`

---

## Milestone 5 — Quality and Security

### Security Audit
- [ ] All API routes have auth guard
- [ ] RLS verified: user cannot access another user's data (tested via Supabase policy tester)
- [ ] No API keys exposed in client bundle
- [ ] User input never interpolated into system prompts
- [ ] Rate limiting verified under load test (k6 or similar)
- [ ] CORS configured to production domain only

### Performance
- [ ] Saju engine calculation < 50ms (p99)
- [ ] AI report first token < 3s (p95)
- [ ] Chart page LCP < 2.5s on 4G
- [ ] Bundle size < 200KB JS (gzipped) on chart page

### Accessibility
- [ ] All form inputs have labels
- [ ] Color information also conveyed via text/icons
- [ ] Keyboard navigation through all core flows
- [ ] Korean `lang` attribute set
- [ ] Lighthouse accessibility score ≥ 90

---

## Milestone 6 — Launch Readiness

- [ ] 20 beta users completed end-to-end flow with positive feedback
- [ ] Korean copy reviewed by native speaker
- [ ] Saju output verified by at least one traditional practitioner
- [ ] Error tracking (Sentry) configured and receiving events
- [ ] Analytics (PostHog) tracking key events: signup, chart_created, report_generated
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Supabase production database configured with backups
- [ ] Vercel production deployment successful
- [ ] Custom domain configured with SSL
- [ ] Production smoke test: full flow from signup → chart → report

---

## Post-MVP Deferred Items (Do Not Build Now)

- ~~Compatibility analysis (궁합)~~
- ~~Business timing reports~~
- ~~AI chat consultation~~
- ~~PDF export~~
- ~~Payment / subscription billing~~
- ~~Mobile app~~
- ~~Voice features~~
- ~~Daily briefings~~
