import type { BirthData, SajuChart } from '../../saju-engine/types'

export interface ApiSuccess<T> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// POST /api/saju/calculate
export interface CalculateRequest {
  birthData: BirthData
  label?: string
}

export interface CalculateResponse {
  profileId: string
  chart: SajuChart
}

// POST /api/interpretation/generate
export interface GenerateRequest {
  profileId: string
  reportType?: 'full' | 'career' | 'relationship' | 'health' | 'yearly'
  focusYear?: number
}

export interface GenerateResponse {
  interpretationId: string
}
