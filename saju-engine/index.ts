import type { BirthData, SajuChart, SolarDate } from './types'
import { calcYearPillar, calcMonthPillar, calcDayPillar, calcHourPillar } from './calculators/pillars'
import { calcElementDistribution, calcElementBalance } from './calculators/elements'
import { deriveTenGod } from './calculators/ten-gods'
import {
  calcLuckCycleStartAge,
  calcLuckCycles,
  calcYearlyFlow,
  isForward,
} from './calculators/luck-cycles'
import { lunarToSolar } from './lunar/converter'
import { getSajuMonth } from './data/solar-terms'

export const ENGINE_VERSION = '0.1.0'

/**
 * Main entry point for the Saju calculation engine.
 * Accepts birth data (solar or lunar) and returns a fully structured SajuChart.
 *
 * This function is pure: same inputs always produce same outputs.
 * No I/O, no randomness, no external calls.
 */
export function calculateSajuChart(birth: BirthData, referenceYear?: number): SajuChart {
  // Step 1: Resolve to solar date
  const solar: SolarDate = birth.isLunar
    ? lunarToSolar(
        { year: birth.year, month: birth.month, day: birth.day, isLeapMonth: birth.isLeapMonth },
        birth.hour,
        birth.minute,
      )
    : { year: birth.year, month: birth.month, day: birth.day, hour: birth.hour, minute: birth.minute }

  // Step 2: Four Pillars
  const yearPillar  = calcYearPillar(solar)
  const monthPillar = calcMonthPillar(solar, yearPillar)
  const dayPillar   = calcDayPillar(solar)
  const hourPillar  = calcHourPillar(solar, dayPillar)

  const dayMaster = dayPillar.stem  // 일간

  // Step 3: Assign Ten Gods to year, month, hour pillars (day master = self)
  yearPillar.tenGod  = deriveTenGod(dayMaster, yearPillar.stem)
  monthPillar.tenGod = deriveTenGod(dayMaster, monthPillar.stem)
  hourPillar.tenGod  = deriveTenGod(dayMaster, hourPillar.stem)

  // Step 4: Five Elements
  const elementDistribution = calcElementDistribution(yearPillar, monthPillar, dayPillar, hourPillar)
  const elementBalance      = calcElementBalance(elementDistribution, dayMaster.element)

  // Step 5: Luck Cycles (대운)
  const forward        = isForward(yearPillar.stem.polarity, birth.gender)
  const sajuMonth      = getSajuMonth(solar.year, solar.month, solar.day)

  // Determine saju year: same as year pillar adjustment (before Ipchun → prev year)
  const sajuYear = yearPillar.stem.index === ((solar.year - 4) % 10 + 10) % 10
    ? solar.year
    : solar.year - 1

  const luckStartAge = calcLuckCycleStartAge(
    solar.year, solar.month, solar.day,
    sajuYear, sajuMonth,
    forward,
  )

  const luckCycles = calcLuckCycles(monthPillar, dayMaster, luckStartAge, forward)

  // Step 6: Current year flow (세운)
  const currentYear = referenceYear ?? new Date().getFullYear()
  const yearlyFlow  = calcYearlyFlow(currentYear)

  return {
    birthData: birth,
    solarDate: solar,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    elementDistribution,
    elementBalance,
    luckCycleStartAge: luckStartAge,
    luckCycles,
    currentYear,
    yearlyFlow,
    engineVersion: ENGINE_VERSION,
  }
}

// Re-export types and utilities for consumers
export type { BirthData, SajuChart } from './types'
export { lunarToSolar, solarToLunar } from './lunar/converter'
