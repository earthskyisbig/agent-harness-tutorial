import type { HeavenlyStem } from '../types'

export const STEMS: readonly HeavenlyStem[] = [
  { index: 0, korean: '갑', hanja: '甲', element: 'wood',  polarity: 'yang' },
  { index: 1, korean: '을', hanja: '乙', element: 'wood',  polarity: 'yin'  },
  { index: 2, korean: '병', hanja: '丙', element: 'fire',  polarity: 'yang' },
  { index: 3, korean: '정', hanja: '丁', element: 'fire',  polarity: 'yin'  },
  { index: 4, korean: '무', hanja: '戊', element: 'earth', polarity: 'yang' },
  { index: 5, korean: '기', hanja: '己', element: 'earth', polarity: 'yin'  },
  { index: 6, korean: '경', hanja: '庚', element: 'metal', polarity: 'yang' },
  { index: 7, korean: '신', hanja: '辛', element: 'metal', polarity: 'yin'  },
  { index: 8, korean: '임', hanja: '壬', element: 'water', polarity: 'yang' },
  { index: 9, korean: '계', hanja: '癸', element: 'water', polarity: 'yin'  },
] as const

export function stemByIndex(index: number): HeavenlyStem {
  const stem = STEMS[((index % 10) + 10) % 10]
  if (!stem) throw new Error(`Invalid stem index: ${index}`)
  return stem
}
