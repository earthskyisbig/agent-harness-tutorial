import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateSajuChart } from '../../../../saju-engine/index'
import type { ApiResponse, CalculateResponse } from '../../../../backend/types/api'

const BirthDataSchema = z.object({
  year:         z.number().int().min(1900).max(2020),
  month:        z.number().int().min(1).max(13),
  day:          z.number().int().min(1).max(30),
  hour:         z.number().int().min(0).max(23),
  minute:       z.number().int().min(0).max(59).default(0),
  gender:       z.enum(['male', 'female']),
  isLunar:      z.boolean(),
  isLeapMonth:  z.boolean().optional(),
})

const RequestSchema = z.object({
  birthData: BirthDataSchema,
  label:     z.string().min(1).max(20).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<CalculateResponse>>> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: '유효하지 않은 요청 형식입니다.' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    return NextResponse.json({ ok: false, error: `입력 값이 올바르지 않습니다: ${issues}` }, { status: 422 })
  }

  const { birthData } = parsed.data

  let chart
  try {
    chart = calculateSajuChart(birthData)
  } catch (err) {
    const message = err instanceof Error ? err.message : '사주 계산 중 오류가 발생했습니다.'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }

  // In MVP: return chart directly without DB persistence (no auth required)
  // TODO: When Supabase is configured, save to saju_profiles and return profileId
  return NextResponse.json({
    ok: true,
    data: {
      profileId: `local-${Date.now()}`,
      chart,
    },
  })
}
