'use client'

import type { LuckCycle, Pillar } from '../../../saju-engine/types'
import { cn, ELEMENT_COLORS } from '../../lib/utils'

interface Props {
  luckCycles: LuckCycle[]
  yearlyFlow: Pillar
  birthYear: number
  currentYear?: number
}

export function LuckCycleBar({ luckCycles, yearlyFlow, birthYear, currentYear = new Date().getFullYear() }: Props) {
  const currentAge = currentYear - birthYear

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">대운 흐름 (大運)</h3>

      <div className="space-y-2">
        {luckCycles.map((lc, i) => {
          const isActive = currentAge >= lc.startAge && currentAge <= lc.endAge
          const colors = ELEMENT_COLORS[lc.pillar.stem.element]

          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                isActive ? 'ring-2 ring-indigo-400 bg-indigo-50' : 'bg-gray-50'
              )}
            >
              <div className="text-xs text-gray-500 w-16 shrink-0 text-right">
                {lc.startAge}–{lc.endAge}세
                {isActive && <span className="block text-indigo-600 font-semibold">현재</span>}
              </div>
              <div className={cn('rounded-lg px-3 py-1 text-center min-w-[72px]', colors.light)}>
                <div className="text-lg font-bold">
                  {lc.pillar.stem.hanja}{lc.pillar.branch.hanja}
                </div>
                <div className="text-xs text-gray-600">
                  {lc.pillar.stem.korean}{lc.pillar.branch.korean}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  {lc.tenGod}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-600">올해 세운 ({currentYear})</span>
          <div className={cn('rounded-lg px-3 py-1 text-center', ELEMENT_COLORS[yearlyFlow.stem.element].light)}>
            <span className="font-bold">{yearlyFlow.stem.hanja}{yearlyFlow.branch.hanja}</span>
            <span className="text-xs text-gray-600 ml-1">
              ({yearlyFlow.stem.korean}{yearlyFlow.branch.korean})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
