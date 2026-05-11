'use client'

import { cn, ELEMENT_COLORS, TEN_GOD_DESCRIPTIONS } from '../../lib/utils'
import { StemBadge } from './StemBadge'
import type { Pillar } from '../../../saju-engine/types'

interface Props {
  yearPillar: Pillar
  monthPillar: Pillar
  dayPillar: Pillar
  hourPillar: Pillar
}

const PILLAR_LABELS = ['년주 (年)', '월주 (月)', '일주 (日)', '시주 (時)']

export function PillarGrid({ yearPillar, monthPillar, dayPillar, hourPillar }: Props) {
  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar]

  return (
    <div className="w-full overflow-x-auto">
      <div className="grid grid-cols-4 gap-2 min-w-[320px]">
        {/* Header row */}
        {PILLAR_LABELS.map((label, i) => (
          <div key={i} className="text-center text-xs text-gray-500 font-medium pb-1">
            {label}
          </div>
        ))}

        {/* Stem row (천간) */}
        {pillars.map((pillar, i) => (
          <div
            key={`stem-${i}`}
            className={cn(
              'rounded-xl p-3 text-center flex flex-col items-center gap-1',
              ELEMENT_COLORS[pillar.stem.element].light
            )}
          >
            <span className="text-2xl font-bold">{pillar.stem.hanja}</span>
            <span className="text-sm text-gray-700">{pillar.stem.korean}</span>
            <StemBadge stem={pillar.stem} size="sm" />
          </div>
        ))}

        {/* Branch row (지지) */}
        {pillars.map((pillar, i) => (
          <div
            key={`branch-${i}`}
            className={cn(
              'rounded-xl p-3 text-center flex flex-col items-center gap-1 mt-1',
              ELEMENT_COLORS[pillar.branch.element].light
            )}
          >
            <span className="text-2xl font-bold">{pillar.branch.hanja}</span>
            <span className="text-sm text-gray-700">{pillar.branch.korean}</span>
            <span className="text-xs text-gray-500">{pillar.branch.animal}</span>
          </div>
        ))}

        {/* Ten Gods row (십성) */}
        {pillars.map((pillar, i) => (
          <div key={`tenGod-${i}`} className="text-center mt-1">
            {i === 2 ? (
              <span className="inline-block text-xs bg-gray-100 text-gray-600 rounded px-2 py-1 font-medium">
                일간 (본원)
              </span>
            ) : pillar.tenGod ? (
              <span
                className="inline-block text-xs bg-indigo-50 text-indigo-700 rounded px-2 py-1 font-medium cursor-help"
                title={TEN_GOD_DESCRIPTIONS[pillar.tenGod]}
              >
                {pillar.tenGod}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
