'use client'

import type { ElementDistribution, ElementBalance } from '../../../saju-engine/types'
import { ELEMENT_COLORS } from '../../lib/utils'

const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
const ELEMENT_KR = { wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)' }
const BALANCE_KR: Record<ElementBalance, string> = {
  strong: '신강 (일간 강함)',
  moderate: '중화 (균형적)',
  weak: '신약 (일간 약함)',
}
const BALANCE_COLOR: Record<ElementBalance, string> = {
  strong: 'text-blue-700 bg-blue-50',
  moderate: 'text-green-700 bg-green-50',
  weak: 'text-orange-700 bg-orange-50',
}

interface Props {
  distribution: ElementDistribution
  balance: ElementBalance
  dayMasterElement: string
}

export function ElementChart({ distribution, balance, dayMasterElement }: Props) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">오행 분포 (五行)</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${BALANCE_COLOR[balance]}`}>
          {BALANCE_KR[balance]}
        </span>
      </div>

      <div className="space-y-2">
        {ELEMENTS.map(elem => {
          const score = distribution[elem] ?? 0
          const pct   = total > 0 ? Math.round((score / total) * 100) : 0
          const colors = ELEMENT_COLORS[elem]
          const isDm  = elem === dayMasterElement

          return (
            <div key={elem} className="flex items-center gap-2">
              <span className={`text-xs w-12 text-right font-medium ${isDm ? 'font-bold' : ''}`}>
                {ELEMENT_KR[elem]}
                {isDm && <span className="ml-0.5 text-xs text-indigo-500">★</span>}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-700 ${colors.bg}`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-500">★ = 일간(日干) 원소</p>
    </div>
  )
}
