import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateInterpretation } from '../../../../backend/services/ai-client'
import { calculateSajuChart } from '../../../../saju-engine/index'
import type { ApiResponse } from '../../../../backend/types/api'

const RequestSchema = z.object({
  // Either pass the full chart or birth data to recalculate
  chart:      z.record(z.unknown()).optional(),
  birthData:  z.record(z.unknown()).optional(),
  reportType: z.enum(['full', 'career', 'relationship', 'health', 'yearly']).default('full'),
  focusYear:  z.number().int().min(2000).max(2100).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env['ANTHROPIC_API_KEY']) {
    return NextResponse.json(
      { ok: false, error: 'AI 서비스가 구성되지 않았습니다.' },
      { status: 503 }
    )
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: '유효하지 않은 요청 형식입니다.' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: '입력 값이 올바르지 않습니다.' }, { status: 422 })
  }

  const { reportType, focusYear } = parsed.data
  const year = focusYear ?? new Date().getFullYear()

  // Resolve the SajuChart
  let chart
  if (parsed.data.chart) {
    chart = parsed.data.chart as unknown as ReturnType<typeof calculateSajuChart>
  } else if (parsed.data.birthData) {
    try {
      chart = calculateSajuChart(parsed.data.birthData as unknown as Parameters<typeof calculateSajuChart>[0])
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : '사주 계산 오류' },
        { status: 400 }
      )
    }
  } else {
    return NextResponse.json({ ok: false, error: 'chart 또는 birthData를 제공해야 합니다.' }, { status: 422 })
  }

  try {
    const report = await generateInterpretation(chart, reportType, year)
    return NextResponse.json({
      ok: true,
      data: {
        interpretationId: `local-${Date.now()}`,
        report,
      },
    } satisfies ApiResponse<{ interpretationId: string; report: typeof report }>)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 보고서 생성 중 오류가 발생했습니다.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
