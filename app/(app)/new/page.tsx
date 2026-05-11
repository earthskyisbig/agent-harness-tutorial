'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BirthInputForm } from '../../components/forms/BirthInputForm'
import type { BirthData } from '../../../saju-engine/types'

export default function NewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(birthData: BirthData) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/saju/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthData }),
      })
      const json = await res.json() as { ok: boolean; data?: { profileId: string; chart: unknown }; error?: string }

      if (!json.ok) {
        setError(json.error ?? '계산 중 오류가 발생했습니다.')
        return
      }

      // Store chart in sessionStorage and redirect to chart view
      sessionStorage.setItem('saju_chart', JSON.stringify(json.data?.chart))
      router.push(`/chart/${json.data?.profileId}`)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">사주 분석하기</h1>
        <p className="text-gray-600 mt-1">생년월일시와 성별을 입력하면 사주팔자를 계산합니다.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <BirthInputForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">🔒 개인정보 안내</p>
        <p>입력하신 생년월일은 사주 계산에만 사용되며, 로그인 없이는 서버에 저장되지 않습니다.</p>
      </div>
    </div>
  )
}
