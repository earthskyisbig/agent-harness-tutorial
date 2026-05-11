# UI Flow — Saju AI App

> Version 1.0 | Status: Planning | Last Updated: 2026-05-12

---

## 1. User Journey Overview

```
Landing Page
    │
    ├─── New User ──▶ Sign Up ──▶ Birth Input Form ──▶ Chart + Report View
    │
    ├─── Returning User ──▶ Login ──▶ Dashboard ──▶ Select Profile ──▶ Chart View
    │
    └─── Anonymous Try ──▶ Demo Input ──▶ Partial Preview ──▶ Gate: Sign Up to Save
```

---

## 2. Page Map

```
/                          Landing page (marketing)
/login                     Login
/signup                    Sign up
/dashboard                 User's saved saju profiles list
/new                       Birth data input form (create new profile)
/chart/[id]                Full chart view
/chart/[id]/elements       Five Elements deep-dive
/chart/[id]/luck           Luck cycles timeline
/chart/[id]/report         Full AI interpretation report
/chart/[id]/chat           AI consultation chat (v2)
/settings                  Account settings, subscription
/about                     What is Saju?
/pricing                   Plans + pricing
```

---

## 3. Screen Flows

### 3.1 Landing Page (`/`)

**Purpose:** Convert visitors to signups; convey scientific/analytical positioning.

**Sections:**
1. Hero — headline, sub-headline, "무료로 시작하기" CTA button
2. "사주팔자란?" — brief educational explainer with illustration
3. Feature highlights — Four Pillars visual, AI report preview, privacy-first
4. Testimonials / sample report excerpt
5. Pricing preview (Free / Pro / Premium)
6. Footer with about, privacy policy, terms

**Key UX decisions:**
- Hero includes an inline mini-form (birth year + month) to hook engagement immediately.
- "무료로 시작하기" leads to `/signup`; if already logged in, to `/new`.

---

### 3.2 Birth Data Input Form (`/new`)

**Purpose:** Collect accurate birth information with minimal friction.

**Form fields:**

| Field | Component | Validation |
|---|---|---|
| Profile label | Text input | Required, 1–20 chars |
| Calendar type | Toggle: 양력 / 음력 | Default: 양력 |
| Birth year | Number input or select | 1900–2010 |
| Birth month | Select (1–12 or lunar month with leap toggle) | Required |
| Birth day | Select (context-aware days) | Required |
| Birth time | Time picker with 2-hour block labels (子시, 丑시…) | "모름" option available |
| Gender | Radio: 남성 / 여성 | Required |

**UX details:**
- When **음력** is toggled on, a secondary toggle appears: "윤달 여부" (leap month).
- Birth time shows both modern time (23:00–00:59) AND the corresponding 시 (子시) to bridge familiarity.
- "시간 모름" option sets time to 정오 (12:00) with a visible disclaimer in the report.
- Form has live validation with Korean-language error messages.
- A subtle "왜 생년월일이 필요한가요?" expandable FAQ reassures privacy-conscious users.
- Submit button: "사주 계산하기" — disabled until all required fields are valid.

**Flow after submit:**
1. Client-side validation passes → POST `/api/saju/calculate`
2. Loading state: animated Four Pillars grid skeleton
3. On success → redirect to `/chart/[newId]`
4. On error → inline error message, form preserved

---

### 3.3 Chart View (`/chart/[id]`)

**Purpose:** Display the calculated chart clearly and trigger report generation.

**Layout (desktop: 2-column, mobile: stacked):**

```
┌─────────────────────────────────────────────────────┐
│  [Profile Label]     [생년월일 · 성별 · 양/음력]       │
├─────────────────────────────────────────────────────┤
│                  四柱八字 그리드                       │
│  ┌──────┬──────┬──────┬──────┐                      │
│  │ 년주  │ 월주  │ 일주  │ 시주  │                      │
│  │  甲   │  丙   │  壬   │  庚   │   (천간 row)         │
│  │ 갑목  │ 병화  │ 임수  │ 경금  │                      │
│  ├──────┼──────┼──────┼──────┤                      │
│  │  子   │  午   │  申   │  辰   │   (지지 row)         │
│  │ 자수  │ 오화  │ 신금  │ 진토  │                      │
│  ├──────┼──────┼──────┼──────┤                      │
│  │ 편재  │ 식신  │ 일주  │ 편관  │   (십성 row)         │
│  └──────┴──────┴──────┴──────┘                      │
├─────────────────────────────────────────────────────┤
│  오행 분포                    │  일간 강약              │
│  [木 ████░░ 30%]             │  신강 (Strong)          │
│  [火 ████░░ 25%]             │                         │
│  [土 ██░░░░ 15%]             │                         │
│  [金 ███░░░ 20%]             │                         │
│  [水 █░░░░░ 10%]             │                         │
├─────────────────────────────────────────────────────┤
│  [AI 해석 보고서 생성하기] ← CTA button                 │
│  (or: 보고서 보기 if already generated)                │
└─────────────────────────────────────────────────────┘
```

**Component sub-navigation tabs:**
- 사주 차트 (default)
- 오행 분석 (`/chart/[id]/elements`)
- 대운 흐름 (`/chart/[id]/luck`)
- AI 보고서 (`/chart/[id]/report`)

---

### 3.4 Five Elements Deep-Dive (`/chart/[id]/elements`)

**Components:**
- Radar chart (오각형 오행 차트) showing distribution
- Bar chart alternative (accessibility)
- Generating / Controlling cycle diagram with the user's dominant elements highlighted
- Textual summary: "당신의 차트는 水 기운이 강하고 金 기운이 부족합니다."
- Hidden stems (지장간) breakdown table

---

### 3.5 Luck Cycles Timeline (`/chart/[id]/luck`)

**Components:**
- Horizontal timeline bar spanning from birth to age ~80
- Each 대운 segment labeled with gapja name, age range, and Ten God
- Current 대운 highlighted with a "현재" marker
- Yearly flow (세운) overlay for the next 5 years shown beneath the main bar
- Tooltip on hover: pillar details + element summary

---

### 3.6 AI Report View (`/chart/[id]/report`)

**States:**
1. **Not generated yet** → full-page CTA card explaining what the report includes, "보고서 생성 (무료)" button
2. **Generating** → section skeletons with streaming text animation; sections appear one by one as they stream from the API
3. **Complete** → full report rendered with section headings, highlights, and cautions

**Report layout:**
```
┌─────────────────────────────────────────────────────┐
│  AI 사주 해석 보고서                                   │
│  일간: 壬水 (임수, 양수)  |  신강 차트                  │
├─────────────────────────────────────────────────────┤
│  📌 타고난 기질과 성격                                  │
│  [narrative text — 200–400 chars]                    │
│  ● 강점: 통찰력 · 직관 · 적응력                        │
│  ⚠ 주의: 감정 기복 관리 필요                           │
├─────────────────────────────────────────────────────┤
│  💼 적성과 직업 방향                                    │
│  [narrative text]                                    │
├─────────────────────────────────────────────────────┤
│  … (5 more sections)                                 │
├─────────────────────────────────────────────────────┤
│  [PDF 저장] [공유하기] [AI 상담 시작하기→]             │
└─────────────────────────────────────────────────────┘
```

**Streaming implementation:**
- Server-Sent Events (SSE) from `/api/interpretation/generate`
- Each section streams as it becomes available from the AI
- `<StreamingText>` component renders characters progressively with a blinking cursor

---

### 3.7 Dashboard (`/dashboard`)

**Layout:**
- Grid of profile cards (up to 3 for free tier, unlimited for pro)
- Each card shows: label, birth date summary, 일간 character, last report date
- "새 사주 추가" card at the end of the grid
- Free tier shows a "Pro로 업그레이드" prompt when at limit

---

### 3.8 AI Chat Consultation (`/chart/[id]/chat`, v2)

**Layout:**
- Left: compact chart summary sidebar (day master, current 대운, 세운)
- Right: chat interface (messages, input field)
- System context loaded silently at session start
- "새 대화 시작" resets conversation; previous sessions accessible via history

---

## 4. Component Library

| Component | Description |
|---|---|
| `PillarGrid` | 4-column grid showing stems, branches, ten gods |
| `StemBadge` | Colored pill showing stem (element color-coded) |
| `BranchBadge` | Colored pill showing branch + animal |
| `TenGodBadge` | Ten God label with tooltip explaining meaning |
| `ElementRadarChart` | SVG radar chart for five elements |
| `ElementBar` | Single element bar with label and % |
| `LuckCycleTimeline` | SVG horizontal timeline with decade markers |
| `ReportSection` | Card with title, content, highlights, cautions |
| `StreamingText` | Animated character-by-character text renderer |
| `BirthInputForm` | Multi-field form with lunar/solar toggle |
| `TimePicker` | 12-slot hour picker with Korean 시 labels |
| `ProfileCard` | Dashboard card for a saju profile |

---

## 5. Responsive Behavior

| Breakpoint | Layout Change |
|---|---|
| Mobile < 640px | PillarGrid stacks to 2×4; charts become vertically scrollable |
| Tablet 640–1024px | 2-column layout; sidebar collapses to tab |
| Desktop > 1024px | Full 2-column with persistent chart sidebar |

---

## 6. Accessibility

- All color coding has text/icon fallback (not color-only information).
- Screen reader labels for all Saju symbols (e.g., `aria-label="갑목, 양목"`).
- Keyboard navigable form with proper focus order.
- Minimum contrast ratio 4.5:1 for all body text.
- Lang attribute: `<html lang="ko">`.

---

## 7. Color System (Element-Based)

| Element | Korean | Primary Color | Light BG |
|---|---|---|---|
| Wood | 목 | `#4CAF50` (green) | `#E8F5E9` |
| Fire | 화 | `#F44336` (red) | `#FFEBEE` |
| Earth | 토 | `#FF9800` (amber) | `#FFF3E0` |
| Metal | 금 | `#9E9E9E` (silver) | `#F5F5F5` |
| Water | 수 | `#2196F3` (blue) | `#E3F2FD` |

These colors are used consistently in `StemBadge`, `BranchBadge`, `ElementBar`, and the radar chart.
