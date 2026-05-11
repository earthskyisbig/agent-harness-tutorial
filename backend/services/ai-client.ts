import type { SajuChart } from '../../saju-engine/types'

export interface ReportSection {
  key: string
  title: string
  content: string
  highlights?: string[]
  cautions?: string[]
}

export interface InterpretationReport {
  version: string
  sections: ReportSection[]
}

const REQUIRED_SECTION_KEYS = [
  'personality', 'career', 'relationships',
  'health', 'luck_cycles', 'current_year', 'advice',
]

const SYSTEM_PROMPT = `당신은 한국 사주명리학(四柱命理學) 전문가입니다. 학술적 깊이와 실용적 통찰을 갖춰 분석 보고서를 작성합니다.

역할:
- 제공된 SajuChart JSON 데이터를 해석하여 구조화된 분석 보고서를 작성합니다.
- 유창하고 따뜻한 전문적인 한국어로 작성합니다.
- 당사자를 '당신' 또는 '본인'으로 지칭합니다.

절대 금지 사항:
1. 계산을 수행하거나 JSON 데이터의 값을 수정하지 마십시오.
2. JSON에 없는 사주 수치나 간지를 창작하지 마십시오.
3. 구체적인 사망, 재난, 돌이킬 수 없는 불운에 대한 단정적 표현을 하지 마십시오.
4. 응답은 반드시 아래 JSON 스키마를 정확히 따라야 합니다.

출력 스키마:
{
  "version": "1.0",
  "sections": [
    {
      "key": string,
      "title": string,
      "content": string,        // 150–400자 한국어 서술
      "highlights": string[],   // 2–4개 핵심 키워드/강점 (선택)
      "cautions": string[]      // 1–3개 주의점 (선택)
    }
  ]
}

필수 섹션 키 (순서 준수):
personality, career, relationships, health, luck_cycles, current_year, advice`

function buildUserPrompt(chart: SajuChart, reportType: string, focusYear: number): string {
  const currentLuck = chart.luckCycles.find(
    lc => lc.startAge <= (focusYear - new Date(chart.birthData.year, 0).getFullYear()) &&
          lc.endAge   >= (focusYear - new Date(chart.birthData.year, 0).getFullYear())
  ) ?? chart.luckCycles[0]

  return `다음은 분석 대상자의 사주팔자 데이터입니다.

=== 사주 차트 데이터 ===
${JSON.stringify(chart, null, 2)}

=== 분석 기준 ===
- 분석 유형: ${reportType}
- 기준 연도: ${focusYear}년
- 현재 대운: ${currentLuck ? `${currentLuck.startAge}세~${currentLuck.endAge}세 (${currentLuck.pillar.stem.korean}${currentLuck.pillar.branch.korean}대운)` : '미정'}
- 올해 세운: ${chart.yearlyFlow.stem.korean}${chart.yearlyFlow.branch.korean}년

위 데이터를 바탕으로 7개 섹션의 사주 해석 보고서를 JSON 형식으로 작성해주세요.
반드시 시스템 프롬프트의 JSON 스키마를 따르세요.`
}

function validateReport(raw: unknown): InterpretationReport {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('AI response is not a JSON object')
  }
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj['sections'])) {
    throw new Error('Missing sections array in AI response')
  }
  const sections = obj['sections'] as unknown[]
  const missing = REQUIRED_SECTION_KEYS.filter(
    k => !sections.some((s: unknown) => typeof s === 'object' && s !== null && (s as Record<string,unknown>)['key'] === k)
  )
  if (missing.length > 0) {
    throw new Error(`AI response missing sections: ${missing.join(', ')}`)
  }
  return obj as unknown as InterpretationReport
}

export async function generateInterpretation(
  chart: SajuChart,
  reportType = 'full',
  focusYear = new Date().getFullYear(),
): Promise<InterpretationReport> {
  const apiKey   = process.env['ANTHROPIC_API_KEY']
  const modelId  = process.env['ANTHROPIC_MODEL'] ?? 'claude-sonnet-4-6'

  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const userPrompt = buildUserPrompt(chart, reportType, focusYear)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${text}`)
  }

  const result = await response.json() as {
    content: Array<{ type: string; text: string }>
  }

  const text = result.content.find(c => c.type === 'text')?.text ?? ''

  // Extract JSON from the response (model may wrap it in markdown fences)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/(\{[\s\S]*\})/)
  const jsonStr = jsonMatch?.[1] ?? text.trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error(`Failed to parse AI JSON response: ${jsonStr.slice(0, 200)}`)
  }

  return validateReport(parsed)
}

export async function generateInterpretationStream(
  chart: SajuChart,
  reportType = 'full',
  focusYear = new Date().getFullYear(),
): Promise<ReadableStream<Uint8Array>> {
  const apiKey  = process.env['ANTHROPIC_API_KEY']
  const modelId = process.env['ANTHROPIC_MODEL'] ?? 'claude-sonnet-4-6'

  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const userPrompt = buildUserPrompt(chart, reportType, focusYear)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Anthropic API error ${response.status}`)
  }

  return response.body
}
