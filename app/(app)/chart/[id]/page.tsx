'use client'

import { useEffect, useState } from 'react'
import { PillarGrid } from '../../../components/saju/PillarGrid'
import { ElementChart } from '../../../components/saju/ElementChart'
import { LuckCycleBar } from '../../../components/saju/LuckCycleBar'
import type { SajuChart } from '../../../../saju-engine/types'

interface ReportSection {
  key: string
  title: string
  content: string
  highlights?: string[]
  cautions?: string[]
}

type Tab = 'chart' | 'elements' | 'luck' | 'report'

export default function ChartPage() {
  const [chart, setChart]         = useState<SajuChart | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('chart')
  const [report, setReport]       = useState<ReportSection[] | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError]   = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('saju_chart')
    if (stored) {
      try { setChart(JSON.parse(stored) as SajuChart) } catch { /* ignore */ }
    }
  }, [])

  async function generateReport() {
    if (!chart) return
    setGenLoading(true)
    setGenError(null)
    try {
      const res = await fetch('/api/interpretation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart }),
      })
      const json = await res.json() as {
        ok: boolean
        data?: { report: { sections: ReportSection[] } }
        error?: string
      }
      if (!json.ok) { setGenError(json.error ?? 'AI 보고서 생성에 실패했습니다.'); return }
      setReport(json.data?.report.sections ?? [])
      setActiveTab('report')
    } catch {
      setGenError('네트워크 오류가 발생했습니다.')
    } finally {
      setGenLoading(false)
    }
  }

  if (!chart) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">사주 데이터를 불러오는 중...</p>
        <a href="/new" className="mt-4 inline-block text-indigo-600 underline text-sm">
          새 사주 분석하기
        </a>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'chart',    label: '사주 차트' },
    { key: 'elements', label: '오행 분석' },
    { key: 'luck',     label: '대운 흐름' },
    { key: 'report',   label: 'AI 보고서' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              일간 <span className="text-indigo-600">
                {chart.dayMaster.hanja}({chart.dayMaster.korean})
              </span> 사주
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {chart.birthData.year}년 {chart.birthData.month}월 {chart.birthData.day}일
              {' '}| {chart.birthData.isLunar ? '음력' : '양력'}
              {' '}| {chart.birthData.gender === 'male' ? '남' : '여'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
              {chart.elementBalance === 'strong' ? '신강' : chart.elementBalance === 'weak' ? '신약' : '중화'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <PillarGrid
              yearPillar={chart.yearPillar}
              monthPillar={chart.monthPillar}
              dayPillar={chart.dayPillar}
              hourPillar={chart.hourPillar}
            />
            <div className="pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => { void generateReport() }}
                disabled={genLoading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {genLoading ? 'AI 보고서 생성 중...' : 'AI 해석 보고서 생성하기'}
              </button>
              {genError && <p className="text-sm text-red-600 mt-2">{genError}</p>}
            </div>
          </div>
        )}

        {activeTab === 'elements' && (
          <ElementChart
            distribution={chart.elementDistribution}
            balance={chart.elementBalance}
            dayMasterElement={chart.dayMaster.element}
          />
        )}

        {activeTab === 'luck' && (
          <LuckCycleBar
            luckCycles={chart.luckCycles}
            yearlyFlow={chart.yearlyFlow}
            birthYear={chart.birthData.year}
          />
        )}

        {activeTab === 'report' && (
          <div className="space-y-4">
            {!report && !genLoading && (
              <div className="text-center py-8 space-y-3">
                <p className="text-gray-500">아직 AI 보고서가 생성되지 않았습니다.</p>
                <button
                  onClick={() => { void generateReport() }}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  AI 보고서 생성하기
                </button>
              </div>
            )}

            {genLoading && (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 mt-4 text-sm">AI가 사주를 분석하고 있습니다...</p>
              </div>
            )}

            {report && report.map(section => (
              <div key={section.key} className="border border-gray-100 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{section.content}</p>
                {section.highlights && section.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {section.highlights.map((h, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        ● {h}
                      </span>
                    ))}
                  </div>
                )}
                {section.cautions && section.cautions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {section.cautions.map((c, i) => (
                      <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                        ⚠ {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="text-center">
        <a href="/new" className="text-sm text-indigo-600 hover:underline">
          + 다른 사주 분석하기
        </a>
      </div>
    </div>
  )
}
