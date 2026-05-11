import type { SolarDate } from '../types'

/**
 * Lunar ↔ Solar calendar conversion.
 * Uses the `korean-lunar-calendar` npm package which implements KARI-validated
 * conversion logic for dates 1900–2050.
 *
 * The package exposes:
 *   KoreanLunarCalendar.setLunarDate(year, month, day, isLeapMonth)
 *   KoreanLunarCalendar.getSolarCalendar() → { year, month, day }
 *
 *   KoreanLunarCalendar.setSolarDate(year, month, day)
 *   KoreanLunarCalendar.getLunarCalendar() → { year, month, day, isLeapMonth }
 */

// Dynamic import to handle both CommonJS and ESM environments
let calendarLib: {
  setLunarDate(y: number, m: number, d: number, leap: boolean): boolean
  getSolarCalendar(): { year: number; month: number; day: number }
  setSolarDate(y: number, m: number, d: number): boolean
  getLunarCalendar(): { year: number; month: number; day: number; isLeapMonth: boolean }
} | null = null

function getLib() {
  if (!calendarLib) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const KoreanLunarCalendar = require('korean-lunar-calendar')
    calendarLib = new KoreanLunarCalendar()
  }
  return calendarLib!
}

export interface LunarInput {
  year: number
  month: number
  day: number
  isLeapMonth?: boolean
}

export interface LunarOutput {
  year: number
  month: number
  day: number
  isLeapMonth: boolean
}

/**
 * Convert a Korean lunar date to the Gregorian (solar) equivalent.
 * Throws if the date is outside the supported range (1900–2050).
 */
export function lunarToSolar(
  lunar: LunarInput,
  hour = 0,
  minute = 0,
): SolarDate {
  const lib = getLib()
  const ok = lib.setLunarDate(
    lunar.year, lunar.month, lunar.day, lunar.isLeapMonth ?? false
  )
  if (!ok) {
    throw new Error(
      `Invalid lunar date: ${lunar.year}-${lunar.month}-${lunar.day}` +
      (lunar.isLeapMonth ? ' (윤달)' : '')
    )
  }
  const solar = lib.getSolarCalendar()
  return { year: solar.year, month: solar.month, day: solar.day, hour, minute }
}

/**
 * Convert a Gregorian (solar) date to the Korean lunar equivalent.
 */
export function solarToLunar(year: number, month: number, day: number): LunarOutput {
  const lib = getLib()
  const ok = lib.setSolarDate(year, month, day)
  if (!ok) {
    throw new Error(`Invalid solar date: ${year}-${month}-${day}`)
  }
  return lib.getLunarCalendar()
}
