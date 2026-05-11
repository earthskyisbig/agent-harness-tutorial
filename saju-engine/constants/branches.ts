import type { EarthlyBranch } from '../types'
import { stemByIndex } from './stems'

export const BRANCHES: readonly EarthlyBranch[] = [
  {
    index: 0, korean: '자', hanja: '子', animal: '쥐', element: 'water', polarity: 'yang',
    hourStart: 23, hourEnd: 1,
    hiddenStems: [{ stem: stemByIndex(9), weight: 1.0 }],                             // 癸
  },
  {
    index: 1, korean: '축', hanja: '丑', animal: '소', element: 'earth', polarity: 'yin',
    hourStart: 1, hourEnd: 3,
    hiddenStems: [{ stem: stemByIndex(5), weight: 0.6 }, { stem: stemByIndex(9), weight: 0.3 }, { stem: stemByIndex(7), weight: 0.1 }], // 己癸辛
  },
  {
    index: 2, korean: '인', hanja: '寅', animal: '호랑이', element: 'wood', polarity: 'yang',
    hourStart: 3, hourEnd: 5,
    hiddenStems: [{ stem: stemByIndex(0), weight: 0.6 }, { stem: stemByIndex(2), weight: 0.3 }, { stem: stemByIndex(4), weight: 0.1 }], // 甲丙戊
  },
  {
    index: 3, korean: '묘', hanja: '卯', animal: '토끼', element: 'wood', polarity: 'yin',
    hourStart: 5, hourEnd: 7,
    hiddenStems: [{ stem: stemByIndex(1), weight: 1.0 }],                             // 乙
  },
  {
    index: 4, korean: '진', hanja: '辰', animal: '용', element: 'earth', polarity: 'yang',
    hourStart: 7, hourEnd: 9,
    hiddenStems: [{ stem: stemByIndex(4), weight: 0.6 }, { stem: stemByIndex(1), weight: 0.3 }, { stem: stemByIndex(9), weight: 0.1 }], // 戊乙癸
  },
  {
    index: 5, korean: '사', hanja: '巳', animal: '뱀', element: 'fire', polarity: 'yin',
    hourStart: 9, hourEnd: 11,
    hiddenStems: [{ stem: stemByIndex(2), weight: 0.6 }, { stem: stemByIndex(6), weight: 0.3 }, { stem: stemByIndex(4), weight: 0.1 }], // 丙庚戊
  },
  {
    index: 6, korean: '오', hanja: '午', animal: '말', element: 'fire', polarity: 'yang',
    hourStart: 11, hourEnd: 13,
    hiddenStems: [{ stem: stemByIndex(3), weight: 0.6 }, { stem: stemByIndex(5), weight: 0.4 }], // 丁己
  },
  {
    index: 7, korean: '미', hanja: '未', animal: '양', element: 'earth', polarity: 'yin',
    hourStart: 13, hourEnd: 15,
    hiddenStems: [{ stem: stemByIndex(5), weight: 0.6 }, { stem: stemByIndex(3), weight: 0.3 }, { stem: stemByIndex(1), weight: 0.1 }], // 己丁乙
  },
  {
    index: 8, korean: '신', hanja: '申', animal: '원숭이', element: 'metal', polarity: 'yang',
    hourStart: 15, hourEnd: 17,
    hiddenStems: [{ stem: stemByIndex(6), weight: 0.6 }, { stem: stemByIndex(8), weight: 0.3 }, { stem: stemByIndex(4), weight: 0.1 }], // 庚壬戊
  },
  {
    index: 9, korean: '유', hanja: '酉', animal: '닭', element: 'metal', polarity: 'yin',
    hourStart: 17, hourEnd: 19,
    hiddenStems: [{ stem: stemByIndex(7), weight: 1.0 }],                             // 辛
  },
  {
    index: 10, korean: '술', hanja: '戌', animal: '개', element: 'earth', polarity: 'yang',
    hourStart: 19, hourEnd: 21,
    hiddenStems: [{ stem: stemByIndex(4), weight: 0.6 }, { stem: stemByIndex(7), weight: 0.3 }, { stem: stemByIndex(3), weight: 0.1 }], // 戊辛丁
  },
  {
    index: 11, korean: '해', hanja: '亥', animal: '돼지', element: 'water', polarity: 'yin',
    hourStart: 21, hourEnd: 23,
    hiddenStems: [{ stem: stemByIndex(8), weight: 0.6 }, { stem: stemByIndex(0), weight: 0.4 }], // 壬甲
  },
] as const

export function branchByIndex(index: number): EarthlyBranch {
  const branch = BRANCHES[((index % 12) + 12) % 12]
  if (!branch) throw new Error(`Invalid branch index: ${index}`)
  return branch
}
