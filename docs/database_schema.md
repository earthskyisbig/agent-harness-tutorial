# Database Schema — Saju AI App

> Version 1.0 | Status: Planning | Last Updated: 2026-05-12  
> Database: PostgreSQL 15 via Supabase

---

## 1. Design Principles

- **Row-Level Security (RLS)** enabled on all user-data tables. Users can only read/write their own rows.
- **UUID primary keys** throughout for portability.
- **JSONB** for flexible structured data (chart outputs, interpretation segments) to allow schema evolution without migrations.
- **Immutable calculations**: once a `saju_profiles` row is created, the `chart_json` is never overwritten — a new version row is inserted instead.
- **Soft deletes**: `deleted_at TIMESTAMPTZ` on user-facing tables.
- **Master/reference tables** are read-only and populated by seed migrations.
- **Indexes** defined per query pattern, not speculatively.

---

## 2. Entity Relationship Overview

```
users (Supabase Auth)
  │
  ├──< saju_profiles          (one user → many saju charts)
  │       │
  │       ├──< interpretations  (one profile → many AI reports)
  │       │       │
  │       │       └──< interpretation_segments (structured sections)
  │       │
  │       └──< chat_sessions    (one profile → many chat threads)
  │               │
  │               └──< chat_messages
  │
  └──< subscriptions           (billing state)

solar_terms                    (reference: solar term timestamps 1900–2100)
lunar_calendar                 (reference: lunar↔solar date mapping)
heavenly_stems                 (reference: 10 stems master data)
earthly_branches               (reference: 12 branches master data)
sixty_gapja                    (reference: 60 gapja cycle)
prompt_templates               (admin-managed AI prompts)
```

---

## 3. Table Definitions

### 3.1 users

Managed by Supabase Auth. Extended profile data stored here.

```sql
-- Extended profile (auth.users is managed by Supabase)
CREATE TABLE public.user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  email           TEXT UNIQUE NOT NULL,
  locale          TEXT NOT NULL DEFAULT 'ko',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Seoul',
  subscription_tier TEXT NOT NULL DEFAULT 'free'
                  CHECK (subscription_tier IN ('free', 'pro', 'premium', 'enterprise')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

### 3.2 saju_profiles

Stores the birth data and calculated chart for each person a user has analysed.

```sql
CREATE TABLE public.saju_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT '나의 사주',   -- user-given name
  -- Birth data (stored as user provided)
  birth_year      SMALLINT NOT NULL,
  birth_month     SMALLINT NOT NULL CHECK (birth_month BETWEEN 1 AND 13),
  birth_day       SMALLINT NOT NULL CHECK (birth_day BETWEEN 1 AND 30),
  birth_hour      SMALLINT NOT NULL CHECK (birth_hour BETWEEN 0 AND 23),
  birth_minute    SMALLINT NOT NULL DEFAULT 0,
  gender          TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  is_lunar        BOOLEAN NOT NULL DEFAULT FALSE,
  is_leap_month   BOOLEAN NOT NULL DEFAULT FALSE,
  -- Resolved solar date (after lunar conversion)
  solar_year      SMALLINT NOT NULL,
  solar_month     SMALLINT NOT NULL,
  solar_day       SMALLINT NOT NULL,
  -- Calculated chart (immutable after creation)
  chart_json      JSONB NOT NULL,          -- full SajuChart object
  engine_version  TEXT NOT NULL,           -- semver of saju-engine used
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT uq_user_profile UNIQUE (user_id, label)
);

CREATE INDEX idx_saju_profiles_user_id ON public.saju_profiles(user_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.saju_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saju profiles"
  ON public.saju_profiles FOR ALL
  USING (auth.uid() = user_id);
```

**`chart_json` structure (TypeScript `SajuChart` serialized):**
```json
{
  "yearPillar":  { "stem": {...}, "branch": {...}, "tenGod": "..." },
  "monthPillar": { "stem": {...}, "branch": {...}, "tenGod": "..." },
  "dayPillar":   { "stem": {...}, "branch": {...} },
  "hourPillar":  { "stem": {...}, "branch": {...}, "tenGod": "..." },
  "dayMaster":   { "korean": "임", "element": "water", "polarity": "yang" },
  "elementDistribution": { "wood": 1.6, "fire": 0.9, "earth": 2.1, "metal": 0.4, "water": 3.0 },
  "elementBalance": "strong",
  "tenGods":     { "yearStem": "편재", "monthStem": "식신", ... },
  "luckCycles":  [ {...}, ... ],
  "yearlyFlow":  { "stem": {...}, "branch": {...} }
}
```

---

### 3.3 interpretations

Each row is one AI-generated report for a specific `saju_profile`.

```sql
CREATE TABLE public.interpretations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saju_profile_id   UUID NOT NULL REFERENCES public.saju_profiles(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type       TEXT NOT NULL DEFAULT 'full'
                    CHECK (report_type IN ('full', 'career', 'relationship', 'health', 'yearly', 'compatibility')),
  focus_year        SMALLINT,             -- NULL for base report; set for yearly reports
  model_id          TEXT NOT NULL,        -- e.g. 'claude-sonnet-4-6'
  prompt_template_id UUID REFERENCES public.prompt_templates(id),
  -- Content
  summary_text      TEXT,                 -- 1-paragraph summary (plain text)
  report_json       JSONB NOT NULL,       -- structured segments
  token_count       INTEGER,
  -- Status
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'generating', 'complete', 'failed')),
  error_message     TEXT,
  generation_ms     INTEGER,              -- latency tracking
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_interpretations_profile ON public.interpretations(saju_profile_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_interpretations_user ON public.interpretations(user_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.interpretations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own interpretations"
  ON public.interpretations FOR ALL
  USING (auth.uid() = user_id);
```

**`report_json` structure:**
```json
{
  "version": "1.0",
  "sections": [
    {
      "key": "personality",
      "title": "타고난 기질과 성격",
      "content": "...",
      "highlights": ["독립심이 강함", "창의적 사고"],
      "cautions": ["고집이 세질 수 있음"]
    },
    {
      "key": "career",
      "title": "적성과 직업 방향",
      "content": "...",
      "highlights": [...],
      "cautions": [...]
    },
    {
      "key": "relationships",
      "title": "인간관계와 연애",
      "content": "..."
    },
    {
      "key": "luck_cycles",
      "title": "대운 흐름",
      "content": "..."
    },
    {
      "key": "current_year",
      "title": "2026년 운세",
      "content": "..."
    }
  ]
}
```

---

### 3.4 chat_sessions and chat_messages

Supports the AI consultation feature (v2).

```sql
CREATE TABLE public.chat_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saju_profile_id   UUID REFERENCES public.saju_profiles(id),
  title             TEXT,
  model_id          TEXT NOT NULL,
  system_context    JSONB,               -- chart snapshot at session creation
  message_count     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at   TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE public.chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT NOT NULL,
  token_count       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, created_at);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own chat sessions"
  ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own chat messages"
  ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
```

---

### 3.5 solar_terms (Reference Table)

Pre-computed solar term timestamps for the Saju Engine.

```sql
CREATE TABLE public.solar_terms (
  id            SERIAL PRIMARY KEY,
  term_name     TEXT NOT NULL,            -- e.g. '입춘'
  term_key      TEXT NOT NULL,            -- e.g. 'ipchun'
  term_number   SMALLINT NOT NULL,        -- 1–24
  saju_month    SMALLINT,                 -- 1–12, NULL for minor terms
  gregorian_year SMALLINT NOT NULL,
  exact_at      TIMESTAMPTZ NOT NULL,     -- precise moment (UTC)
  UNIQUE (term_name, gregorian_year)
);

CREATE INDEX idx_solar_terms_year ON public.solar_terms(gregorian_year);
CREATE INDEX idx_solar_terms_exact ON public.solar_terms(exact_at);
```

---

### 3.6 lunar_calendar (Reference Table)

Pre-computed lunar↔solar date mapping.

```sql
CREATE TABLE public.lunar_calendar (
  id              SERIAL PRIMARY KEY,
  lunar_year      SMALLINT NOT NULL,
  lunar_month     SMALLINT NOT NULL,
  is_leap_month   BOOLEAN NOT NULL DEFAULT FALSE,
  lunar_day       SMALLINT NOT NULL,
  solar_year      SMALLINT NOT NULL,
  solar_month     SMALLINT NOT NULL,
  solar_day       SMALLINT NOT NULL,
  UNIQUE (lunar_year, lunar_month, is_leap_month, lunar_day)
);

CREATE INDEX idx_lunar_to_solar ON public.lunar_calendar(lunar_year, lunar_month, lunar_day);
CREATE INDEX idx_solar_to_lunar ON public.lunar_calendar(solar_year, solar_month, solar_day);
```

---

### 3.7 Master Tables (heavenly_stems, earthly_branches, sixty_gapja)

```sql
CREATE TABLE public.heavenly_stems (
  index_num   SMALLINT PRIMARY KEY,  -- 0–9
  korean      TEXT NOT NULL,
  hanja       TEXT NOT NULL,
  element     TEXT NOT NULL,
  polarity    TEXT NOT NULL
);

CREATE TABLE public.earthly_branches (
  index_num       SMALLINT PRIMARY KEY,  -- 0–11
  korean          TEXT NOT NULL,
  hanja           TEXT NOT NULL,
  animal          TEXT NOT NULL,
  element         TEXT NOT NULL,
  polarity        TEXT NOT NULL,
  hour_start      SMALLINT NOT NULL,    -- KST hour range start
  hour_end        SMALLINT NOT NULL,
  hidden_stems    JSONB NOT NULL        -- [{stemIndex, weight}, ...]
);

CREATE TABLE public.sixty_gapja (
  index_num     SMALLINT PRIMARY KEY,  -- 0–59
  stem_index    SMALLINT NOT NULL REFERENCES public.heavenly_stems(index_num),
  branch_index  SMALLINT NOT NULL REFERENCES public.earthly_branches(index_num),
  korean_name   TEXT NOT NULL          -- e.g. '갑자', '을축'
);
```

---

### 3.8 prompt_templates (Admin Table)

Admin-managed AI prompt templates. Decouples prompt text from application code.

```sql
CREATE TABLE public.prompt_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT UNIQUE NOT NULL,    -- e.g. 'full_report_v2'
  report_type   TEXT NOT NULL,
  model_family  TEXT NOT NULL,           -- 'claude' | 'openai'
  system_prompt TEXT NOT NULL,
  user_prompt   TEXT NOT NULL,           -- Handlebars/Mustache template
  output_schema JSONB NOT NULL,          -- JSON Schema for response validation
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  version       INTEGER NOT NULL DEFAULT 1,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.9 subscriptions

Tracks billing state per user.

```sql
CREATE TABLE public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  tier                  TEXT NOT NULL DEFAULT 'free',
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  payment_provider      TEXT,           -- 'stripe' | 'tosspayments'
  provider_customer_id  TEXT,
  provider_subscription_id TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 4. Usage Tracking

```sql
CREATE TABLE public.usage_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  event_type    TEXT NOT NULL,   -- 'interpretation_generated', 'chat_message', etc.
  profile_id    UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user ON public.usage_events(user_id, created_at DESC);
```

---

## 5. Migration Strategy

1. All schema changes managed via **Supabase migrations** (`supabase/migrations/`).
2. Reference tables seeded via `scripts/seed-master-data.ts`.
3. No raw SQL in application code — all queries via Supabase JS SDK.
4. Backward-compatible migrations only; columns are added not dropped while in use.
5. Staging database receives migrations 24 hours before production.
