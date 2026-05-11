import type { Element } from '../types'

// Wood → Fire → Earth → Metal → Water → Wood
export const GENERATING_CYCLE: Record<Element, Element> = {
  wood:  'fire',
  fire:  'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

// Wood controls Earth, Earth controls Water, ...
export const CONTROLLING_CYCLE: Record<Element, Element> = {
  wood:  'earth',
  earth: 'water',
  water: 'fire',
  fire:  'metal',
  metal: 'wood',
}

// What generates this element (reverse of GENERATING_CYCLE)
export const GENERATED_BY: Record<Element, Element> = {
  fire:  'wood',
  earth: 'fire',
  metal: 'earth',
  water: 'metal',
  wood:  'water',
}

// What controls this element (reverse of CONTROLLING_CYCLE)
export const CONTROLLED_BY: Record<Element, Element> = {
  earth: 'wood',
  water: 'earth',
  fire:  'water',
  metal: 'fire',
  wood:  'metal',
}

// Month stem base index per year stem (for month pillar derivation)
// Year stem index → starting stem index for Saju month 1 (寅월)
export const MONTH_STEM_BASE: Record<number, number> = {
  0: 2,  // 갑 → 丙寅
  5: 2,  // 기 → 丙寅
  1: 4,  // 을 → 戊寅
  6: 4,  // 경 → 戊寅
  2: 6,  // 병 → 庚寅
  7: 6,  // 신 → 庚寅
  3: 8,  // 정 → 壬寅
  8: 8,  // 임 → 壬寅
  4: 0,  // 무 → 甲寅
  9: 0,  // 계 → 甲寅
}

// Hour stem base index per day stem
// Day stem index → starting stem index for 子시 (hour 0)
export const HOUR_STEM_BASE: Record<number, number> = {
  0: 0,  // 갑 → 甲子
  5: 0,  // 기 → 甲子
  1: 2,  // 을 → 丙子
  6: 2,  // 경 → 丙子
  2: 4,  // 병 → 戊子
  7: 4,  // 신 → 戊子
  3: 6,  // 정 → 庚子
  8: 6,  // 임 → 庚子
  4: 8,  // 무 → 壬子
  9: 8,  // 계 → 壬子
}

// Saju month number (1–12) → branch index
// Month 1 starts at Ipchun (寅=2), cycles through 12 branches
export const MONTH_BRANCH: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1]
