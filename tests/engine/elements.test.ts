import { describe, it, expect } from 'vitest'
import { calcElementDistribution, calcElementBalance } from '../../saju-engine/calculators/elements'
import { calcYearPillar, calcMonthPillar, calcDayPillar, calcHourPillar } from '../../saju-engine/calculators/pillars'
import type { SolarDate } from '../../saju-engine/types'

function sd(year: number, month: number, day: number, hour = 12): SolarDate {
  return { year, month, day, hour, minute: 0 }
}

describe('Element Distribution (오행 분포)', () => {
  it('returns all five elements in result', () => {
    const solar = sd(1990, 9, 9)
    const yp = calcYearPillar(solar)
    const mp = calcMonthPillar(solar, yp)
    const dp = calcDayPillar(solar)
    const hp = calcHourPillar(solar, dp)
    const dist = calcElementDistribution(yp, mp, dp, hp)
    expect(Object.keys(dist).sort()).toEqual(['earth', 'fire', 'metal', 'water', 'wood'])
  })

  it('total score roughly equals 4 stems + hidden stem weights', () => {
    const solar = sd(1990, 9, 9)
    const yp = calcYearPillar(solar)
    const mp = calcMonthPillar(solar, yp)
    const dp = calcDayPillar(solar)
    const hp = calcHourPillar(solar, dp)
    const dist = calcElementDistribution(yp, mp, dp, hp)
    const total = Object.values(dist).reduce((a, b) => a + b, 0)
    // 4 stems × 1.0 + branch hidden stems total ≈ 8.0 (each branch has weights summing to ~1.0–2.0)
    expect(total).toBeGreaterThan(7)
    expect(total).toBeLessThan(12)
  })

  it('all values are non-negative', () => {
    const solar = sd(2000, 3, 15)
    const yp = calcYearPillar(solar)
    const mp = calcMonthPillar(solar, yp)
    const dp = calcDayPillar(solar)
    const hp = calcHourPillar(solar, dp)
    const dist = calcElementDistribution(yp, mp, dp, hp)
    for (const v of Object.values(dist)) {
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('Element Balance (신강/신약)', () => {
  it('returns strong when element score > 35% of total', () => {
    const dist = { wood: 5, fire: 1, earth: 1, metal: 1, water: 1 }
    // wood = 5/9 ≈ 55%
    expect(calcElementBalance(dist, 'wood')).toBe('strong')
  })

  it('returns weak when element score < 15% of total', () => {
    const dist = { wood: 1, fire: 3, earth: 3, metal: 3, water: 3 }
    // wood = 1/13 ≈ 7.7%
    expect(calcElementBalance(dist, 'wood')).toBe('weak')
  })

  it('returns moderate for balanced chart', () => {
    const dist = { wood: 2, fire: 2, earth: 2, metal: 2, water: 2 }
    // wood = 2/10 = 20%
    expect(calcElementBalance(dist, 'wood')).toBe('moderate')
  })
})
