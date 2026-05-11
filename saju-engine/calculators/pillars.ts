import type { Pillar, SolarDate } from '../types'
import { stemByIndex } from '../constants/stems'
import { branchByIndex } from '../constants/branches'
import { MONTH_STEM_BASE, MONTH_BRANCH, HOUR_STEM_BASE } from '../constants/cycles'
import { getSajuMonth, getIpchunDate } from '../data/solar-terms'

// ── Year Pillar ────────────────────────────────────────────────────────────

function isBeforeIpchun(year: number, month: number, day: number): boolean {
  const ipchun = getIpchunDate(year)
  const [, ipMonth, ipDay] = ipchun.split('-').map(Number) as [number, number, number]
  if (month < ipMonth) return true
  if (month === ipMonth && day < ipDay) return true
  return false
}

export function calcYearPillar(solar: SolarDate): Pillar {
  const sajuYear = isBeforeIpchun(solar.year, solar.month, solar.day)
    ? solar.year - 1
    : solar.year
  const stemIdx   = ((sajuYear - 4) % 10 + 10) % 10
  const branchIdx = ((sajuYear - 4) % 12 + 12) % 12
  return { stem: stemByIndex(stemIdx), branch: branchByIndex(branchIdx) }
}

// ── Month Pillar ───────────────────────────────────────────────────────────

export function calcMonthPillar(solar: SolarDate, yearPillar: Pillar): Pillar {
  const sajuMonth = getSajuMonth(solar.year, solar.month, solar.day)  // 1–12
  const branchIdx = MONTH_BRANCH[sajuMonth - 1]
  if (branchIdx === undefined) throw new Error(`Invalid saju month: ${sajuMonth}`)

  const yearStemIdx = yearPillar.stem.index
  const base = MONTH_STEM_BASE[yearStemIdx]
  if (base === undefined) throw new Error(`Invalid year stem index: ${yearStemIdx}`)
  const stemIdx = (base + (sajuMonth - 1)) % 10

  return { stem: stemByIndex(stemIdx), branch: branchByIndex(branchIdx) }
}

// ── Day Pillar ─────────────────────────────────────────────────────────────

/**
 * Calculates the Day Pillar using Julian Day Number.
 * JDN for the reference date 1900-01-01 = 2415021, which is 甲戌일 (gapja index 10).
 */
function julianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

// Calibrated from verified case: 1990-09-09 = 壬午日 (gapja index 18)
// JDN(1990-09-09) = 2448144; REFERENCE_JDN = 2448144 - 18 = 2448126
const REFERENCE_JDN = 2448126

export function calcDayPillar(solar: SolarDate): Pillar {
  const jdn = julianDayNumber(solar.year, solar.month, solar.day)
  const gapjaIdx = ((jdn - REFERENCE_JDN) % 60 + 60) % 60
  return {
    stem:   stemByIndex(gapjaIdx % 10),
    branch: branchByIndex(gapjaIdx % 12),
  }
}

// ── Hour Pillar ────────────────────────────────────────────────────────────

/**
 * Maps KST hour (0-23) to a branch index (子=0 at 23:00, 丑=1 at 01:00…)
 * 子시: 23:00–00:59  → branch 0
 * 丑시: 01:00–02:59  → branch 1
 * …
 * 亥시: 21:00–22:59  → branch 11
 */
export function hourToBranchIndex(hour: number): number {
  if (hour === 23) return 0  // 子시 starts at 23
  return Math.floor((hour + 1) / 2)
}

export function calcHourPillar(solar: SolarDate, dayPillar: Pillar): Pillar {
  const branchIdx = hourToBranchIndex(solar.hour)
  const dayStemIdx = dayPillar.stem.index
  const base = HOUR_STEM_BASE[dayStemIdx]
  if (base === undefined) throw new Error(`Invalid day stem index: ${dayStemIdx}`)
  const stemIdx = (base + branchIdx) % 10
  return { stem: stemByIndex(stemIdx), branch: branchByIndex(branchIdx) }
}
