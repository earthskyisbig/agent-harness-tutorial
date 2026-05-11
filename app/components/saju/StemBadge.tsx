'use client'

import { cn, ELEMENT_COLORS } from '../../lib/utils'
import type { HeavenlyStem } from '../../../saju-engine/types'

interface Props {
  stem: HeavenlyStem
  size?: 'sm' | 'md' | 'lg'
  showHanja?: boolean
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
}

export function StemBadge({ stem, size = 'md', showHanja = false }: Props) {
  const colors = ELEMENT_COLORS[stem.element]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-semibold',
        colors.bg, colors.text,
        sizeClasses[size]
      )}
      title={`${stem.korean}(${stem.hanja}) ${stem.element === 'wood' ? '목' : stem.element === 'fire' ? '화' : stem.element === 'earth' ? '토' : stem.element === 'metal' ? '금' : '수'}${stem.polarity === 'yang' ? ' 양' : ' 음'}`}
    >
      {showHanja ? stem.hanja : stem.korean}
      <span className="opacity-70 text-xs">{stem.polarity === 'yang' ? '+' : '-'}</span>
    </span>
  )
}
