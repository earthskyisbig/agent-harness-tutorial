import type { HeavenlyStem, TenGod, Element, Polarity } from '../types'
import { GENERATING_CYCLE, CONTROLLING_CYCLE } from '../constants/cycles'

/**
 * Derives the Ten God relationship between the Day Master and a target stem.
 *
 * Relationships (relative to Day Master 일간):
 *  Same element + same polarity     → 비견 (Bijeon)
 *  Same element + diff polarity     → 겁재 (Geopjae)
 *  DM generates + same polarity     → 식신 (Sikshin)
 *  DM generates + diff polarity     → 상관 (Sanggwan)
 *  DM controls + same polarity      → 편재 (Pyeonjae)
 *  DM controls + diff polarity      → 정재 (Jeongjae)
 *  Controls DM + same polarity      → 편관 (Pyeongwan)
 *  Controls DM + diff polarity      → 정관 (Jeonggwan)
 *  Generates DM + same polarity     → 편인 (Pyeonin)
 *  Generates DM + diff polarity     → 정인 (Jeongin)
 */
export function deriveTenGod(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGod {
  const dmElem: Element   = dayMaster.element
  const tgtElem: Element  = target.element
  const dmPol: Polarity   = dayMaster.polarity
  const tgtPol: Polarity  = target.polarity
  const samePolarity      = dmPol === tgtPol

  if (dmElem === tgtElem) {
    return samePolarity ? '비견' : '겁재'
  }
  if (GENERATING_CYCLE[dmElem] === tgtElem) {
    return samePolarity ? '식신' : '상관'
  }
  if (CONTROLLING_CYCLE[dmElem] === tgtElem) {
    return samePolarity ? '편재' : '정재'
  }
  if (CONTROLLING_CYCLE[tgtElem] === dmElem) {
    return samePolarity ? '편관' : '정관'
  }
  if (GENERATING_CYCLE[tgtElem] === dmElem) {
    return samePolarity ? '편인' : '정인'
  }

  throw new Error(
    `Cannot derive Ten God: DM=${dmElem}(${dmPol}) → target=${tgtElem}(${tgtPol})`
  )
}

/**
 * For a branch, derive Ten God from its main hidden stem (지장간 주기).
 */
export function deriveTenGodFromBranch(
  dayMaster: HeavenlyStem,
  branchMainStem: HeavenlyStem,
): TenGod {
  return deriveTenGod(dayMaster, branchMainStem)
}
