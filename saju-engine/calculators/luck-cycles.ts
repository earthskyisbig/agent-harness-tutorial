import type { Pillar, LuckCycle, Gender } from '../types'
import { stemByIndex } from '../constants/stems'
import { branchByIndex } from '../constants/branches'
import { deriveTenGod } from './ten-gods'
import { getSajuMonthTermDate } from '../data/solar-terms'

/**
 * Whether to progress forward or backward through the gapja cycle.
 * Forward:  Yang year stem + male, OR Yin year stem + female
 * Backward: Yang year stem + female, OR Yin year stem + male
 */
function isForward(yearStemPolarity: 'yang' | 'yin', gender: Gender): boolean {
  return (yearStemPolarity === 'yang') === (gender === 'male')
}

/**
 * Calculate the starting age of the first 대운 (luck cycle).
 * The rule: count days between birth and the nearest solar term
 * (forward for forward-progressing, backward for backward-progressing),
 * then divide by 3 to get the starting age in years.
 */
function dateDiffDays(
  y1: number, m1: number, d1: number,
  y2: number, m2: number, d2: number,
): number {
  const a = Date.UTC(y1, m1 - 1, d1)
  const b = Date.UTC(y2, m2 - 1, d2)
  return Math.round(Math.abs(b - a) / 86_400_000)
}

function parseIso(iso: string): [number, number, number] {
  const parts = iso.split('-').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
}

export function calcLuckCycleStartAge(
  birthYear: number, birthMonth: number, birthDay: number,
  sajuYear: number, sajuMonth: number,
  forward: boolean,
): number {
  // Find the nearest term date in the forward/backward direction
  let termDate: string
  if (forward) {
    // Next solar term after birth: the start of the NEXT saju month
    const nextSajuMonth = sajuMonth === 12 ? 1 : sajuMonth + 1
    const nextSajuYear  = sajuMonth === 12 ? sajuYear + 1 : sajuYear
    termDate = getSajuMonthTermDate(nextSajuYear, nextSajuMonth)
  } else {
    // Previous solar term before birth: start of current saju month
    termDate = getSajuMonthTermDate(sajuYear, sajuMonth)
  }

  const [ty, tm, td] = parseIso(termDate)
  const days = dateDiffDays(birthYear, birthMonth, birthDay, ty, tm, td)
  // 3 days ≈ 1 year of starting age; round to nearest integer
  return Math.round(days / 3)
}

function pillarToGapjaIndex(pillar: Pillar): number {
  // Find the consistent gapja index: stem % 10 and branch % 12 must agree
  // Walk through 60 gapja to find matching (stem.index, branch.index)
  const si = pillar.stem.index
  const bi = pillar.branch.index
  for (let i = 0; i < 60; i++) {
    if (i % 10 === si && i % 12 === bi) return i
  }
  throw new Error(`Cannot find gapja index for stem=${si} branch=${bi}`)
}

/**
 * Generates 8 consecutive luck cycles (대운) starting from the month pillar.
 */
export function calcLuckCycles(
  monthPillar: Pillar,
  dayMasterStem: ReturnType<typeof stemByIndex>,
  startAge: number,
  forward: boolean,
  count = 8,
): LuckCycle[] {
  const cycles: LuckCycle[] = []
  let gapjaIdx = pillarToGapjaIndex(monthPillar)

  for (let i = 0; i < count; i++) {
    gapjaIdx = forward
      ? (gapjaIdx + 1) % 60
      : ((gapjaIdx - 1) + 60) % 60

    const pillar: Pillar = {
      stem:   stemByIndex(gapjaIdx % 10),
      branch: branchByIndex(gapjaIdx % 12),
    }
    const mainHiddenStem = pillar.branch.hiddenStems[0]?.stem ?? pillar.stem
    cycles.push({
      startAge: startAge + i * 10,
      endAge:   startAge + i * 10 + 9,
      pillar,
      tenGod: deriveTenGod(dayMasterStem, mainHiddenStem),
    })
  }
  return cycles
}

/**
 * Computes the yearly flow (세운) for the given Gregorian year.
 */
export function calcYearlyFlow(gregorianYear: number): Pillar {
  const gapjaIdx = ((gregorianYear - 4) % 60 + 60) % 60
  return {
    stem:   stemByIndex(gapjaIdx % 10),
    branch: branchByIndex(gapjaIdx % 12),
  }
}

export { isForward }
