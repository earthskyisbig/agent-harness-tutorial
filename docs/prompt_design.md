# AI Prompt Design — Saju AI App

> Version 1.0 | Status: Planning | Last Updated: 2026-05-12

---

## 1. Architecture Philosophy

### Strict Separation of Concerns

```
Saju Engine (TypeScript)          AI Interpretation Layer (LLM)
─────────────────────────         ───────────────────────────────
✅ Calculates Four Pillars         ✅ Interprets structured JSON
✅ Derives Five Elements           ✅ Generates narrative text
✅ Assigns Ten Gods                ✅ Contextualizes for user
✅ Computes Luck Cycles            ✅ Connects patterns to life domains
❌ Never interprets meaning        ❌ Never performs calculations
❌ Never generates text            ❌ Never invents chart data
```

**The AI receives a completed `SajuChart` JSON object. It is only permitted to interpret what is in that object — not to compute, modify, or augment it.**

### Hallucination Prevention Measures

1. **Explicit prohibition in system prompt**: "You must not perform any Saju calculations. All data is provided to you. Do not invent numbers, stems, branches, or elements."
2. **Structured JSON output**: AI must respond in a defined JSON schema. Unstructured prose is rejected.
3. **Output validation**: Every AI response is parsed against a JSON Schema before being saved. Failures trigger a retry or error state.
4. **No user raw input in prompts**: User text input (name, questions) is sanitized and injected only into designated safe slots — never into the system prompt.

---

## 2. Prompt Pipeline Architecture

```
[BirthData]
    │
    ▼
[Saju Engine]
    │
    ▼
[SajuChart JSON]
    │
    ├──▶ [PromptBuilder]
    │         │
    │         ├─ Selects active PromptTemplate from DB by report_type
    │         ├─ Injects SajuChart as serialized JSON block
    │         ├─ Injects analysis focus context
    │         └─ Injects output schema instructions
    │
    ▼
[AI API Call] (claude-sonnet-4-6 or gpt-4o)
    │
    ▼
[ResponseValidator]  ──── fails? ──▶ [RetryHandler] (max 2 retries)
    │                                      │
    │ passes                               │ still fails → status: 'failed'
    ▼                                      │
[InterpretationReport saved to DB] ◀───────┘
    │
    ▼
[Streamed to Client via SSE / ReadableStream]
```

---

## 3. System Prompt (Base — Full Report)

```
You are an expert in Korean Saju-Myeongri (사주명리학), trained to analyze
Four Pillars charts with scholarly depth and practical insight.

YOUR ROLE:
- You receive a pre-calculated SajuChart JSON object.
- Your task is to interpret this chart and produce a structured analysis report.
- Write in fluent, warm, professional Korean (한국어).
- Address the person respectfully in 2nd person (당신, 본인).

CRITICAL CONSTRAINTS:
1. Do NOT perform any calculations. All values are already computed.
2. Do NOT modify, correct, or second-guess any value in the JSON.
3. Do NOT reference your training data about specific people or predict
   concrete external events (marriage date, specific income amounts).
4. Do NOT produce harmful or deterministic statements about death,
   catastrophic illness, or irreversible misfortune.
5. Your output MUST be valid JSON matching the schema provided below.
6. Each section must be 150–400 Korean characters in length.

INTERPRETIVE FRAMEWORK:
- The Day Master (일간) is the center of analysis.
- elementBalance indicates whether the chart is strong (신강) or weak (신약).
- Ten Gods reveal personality structure and life patterns.
- Luck Cycles (대운) indicate decadal energy shifts.
- Yearly Flow (세운) shows the current year's overlay energy.

OUTPUT SCHEMA:
{
  "version": "1.0",
  "sections": [
    {
      "key": string,           // must match one of the required section keys
      "title": string,         // Korean title for the section
      "content": string,       // 150–400 char Korean narrative
      "highlights": string[],  // 2–4 bullet strengths or themes
      "cautions": string[]     // 1–3 shadow traits or watchpoints (optional)
    }
  ]
}

REQUIRED SECTION KEYS (in order):
1. "personality"     — core character, innate strengths, values
2. "career"          — suitable work styles, vocational direction
3. "relationships"   — interpersonal patterns, love style, family dynamics
4. "health"          — constitutional tendencies, areas requiring care
5. "luck_cycles"     — current 대운 energy and upcoming shift
6. "current_year"    — this year's 세운 overlay and key themes
7. "advice"          — integrative guidance, what to cultivate this year

Do not add sections beyond these seven.
```

---

## 4. User Prompt Template (Full Report)

```handlebars
다음은 분석 대상자의 사주팔자 데이터입니다.

=== 사주 차트 데이터 ===
{{sajuChartJson}}

=== 분석 기준 정보 ===
- 현재 연도: {{currentYear}}년
- 현재 대운: {{currentLuckCycle.startAge}}세 ~ {{currentLuckCycle.endAge}}세 대운
  ({{currentLuckCycle.pillar.stem.korean}}{{currentLuckCycle.pillar.branch.korean}})
- 올해 세운: {{yearlyFlow.stem.korean}}{{yearlyFlow.branch.korean}}

위 데이터를 바탕으로 7개 섹션으로 구성된 사주 해석 보고서를 JSON 형식으로 작성해주세요.
시스템 프롬프트에 제시된 JSON 스키마를 정확히 따라야 합니다.
```

---

## 5. Specialized Report Prompts

### 5.1 Career Report (직업 분석)

**System prompt additions:**
```
Focus this analysis primarily on career and vocation. Expand the "career" section
to 600–800 characters. Analyze which of the Ten Gods are most active in the
career sector. Consider the 정관/편관 balance for authority orientation,
식신/상관 for creative vs. technical output, 정재/편재 for commercial instinct.
Suggest 3–5 specific industry or role categories that align with the chart.
```

### 5.2 Relationship Compatibility (궁합, v2)

**System prompt additions:**
```
You will receive TWO SajuChart objects: Person A and Person B.
Analyze their elemental compatibility (오행 상생상극), Ten Gods interaction,
and Day Pillar harmony. Produce a compatibility score from 1–10 with justification.
Do NOT give a binary "compatible/incompatible" verdict — explain the dynamics.
```

### 5.3 Yearly Deep Report (세운 분석)

**System prompt additions:**
```
Focus on the interaction between the natal chart, the active 대운, and the
{{focusYear}} 세운. Analyze which life domains (career, relationships, health,
finances) are activated this year. Identify the 3–6 month periods within the
year that carry different energies based on monthly 월운 transitions.
```

---

## 6. Chat Consultation System Prompt (v2)

```
You are a compassionate, knowledgeable Saju consultant.
The user's SajuChart has been provided in the system context below.
Your role is to help the user understand their chart through conversation.

RULES:
1. You have memory of this conversation. Reference previous messages when relevant.
2. Ground all answers in the provided chart data.
3. If asked something unrelated to Saju or the user's wellbeing, gently redirect.
4. Do not make absolute predictions. Frame insights as tendencies and energies.
5. When uncertain, say so — do not hallucinate chart details.
6. Keep responses to 150–300 Korean characters per turn unless user asks for depth.

USER'S CHART CONTEXT:
{{sajuChartJson}}
```

---

## 7. Prompt Versioning Strategy

| Field | Description |
|---|---|
| `key` | Unique identifier: `full_report_v1`, `career_v2`, etc. |
| `version` | Integer incremented on meaningful change |
| `is_active` | Only one version per `report_type` should be active |
| `model_family` | `'claude'` or `'openai'` — prompts may differ by model |

**Migration process:**
1. New prompt version created with `is_active = false`.
2. A/B tested against previous version on 10% of traffic.
3. If quality metrics improve, promoted to `is_active = true`; old version deactivated.
4. All interpretations store `prompt_template_id` for full audit trail.

---

## 8. Output Validation Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "sections"],
  "properties": {
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+$" },
    "sections": {
      "type": "array",
      "minItems": 7,
      "maxItems": 7,
      "items": {
        "type": "object",
        "required": ["key", "title", "content"],
        "properties": {
          "key":        { "type": "string", "minLength": 1 },
          "title":      { "type": "string", "minLength": 1 },
          "content":    { "type": "string", "minLength": 50, "maxLength": 1000 },
          "highlights": { "type": "array", "items": { "type": "string" }, "maxItems": 5 },
          "cautions":   { "type": "array", "items": { "type": "string" }, "maxItems": 4 }
        }
      }
    }
  }
}
```

---

## 9. Prompt Injection Prevention

| Attack Vector | Mitigation |
|---|---|
| User name containing prompt instructions | Name is injected into a clearly delimited data field, never the system prompt |
| Malicious birth date text input | Inputs are validated as numeric before reaching the engine |
| Chat message injection | Chat messages are passed as `role: "user"` in the messages array, not interpolated into the system prompt string |
| Admin prompt template XSS | Templates are stored as plain text; rendered with escaping |

---

## 10. Cost and Latency Management

| Strategy | Implementation |
|---|---|
| Cache identical chart interpretations | Hash `SajuChart JSON + report_type + focus_year` → check DB before calling AI |
| Streaming output | Use `stream: true` on AI API; pipe via SSE to client for perceived speed |
| Model tiering | Free tier: claude-haiku-4-5; Pro: claude-sonnet-4-6; Premium: claude-opus-4-7 |
| Token budgets | System + user prompt ≤ 2,000 tokens; output capped at 1,500 tokens |
| Rate limiting | 5 AI calls/hour for free, 30/hour for pro, 100/hour for premium |
