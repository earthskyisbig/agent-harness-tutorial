import { describe, it, expect } from 'vitest'
import { calculateSajuChart } from '../../saju-engine/index'
import type { BirthData } from '../../saju-engine/types'

describe('calculateSajuChart integration', () => {
  const birth1990: BirthData = {
    year: 1990, month: 9, day: 9,
    hour: 13, minute: 0,
    gender: 'male',
    isLunar: false,
  }

  it('returns a complete SajuChart structure', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    expect(chart.yearPillar).toBeDefined()
    expect(chart.monthPillar).toBeDefined()
    expect(chart.dayPillar).toBeDefined()
    expect(chart.hourPillar).toBeDefined()
    expect(chart.dayMaster).toBeDefined()
    expect(chart.elementDistribution).toBeDefined()
    expect(chart.elementBalance).toMatch(/^(strong|moderate|weak)$/)
    expect(chart.luckCycles).toHaveLength(8)
    expect(chart.yearlyFlow).toBeDefined()
  })

  it('1990-09-09: year pillar is 경오(庚午)', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    expect(chart.yearPillar.stem.korean).toBe('경')
    expect(chart.yearPillar.branch.korean).toBe('오')
  })

  it('1990-09-09: day pillar is 임오(壬午)', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    expect(chart.dayPillar.stem.korean).toBe('임')
    expect(chart.dayPillar.branch.korean).toBe('오')
  })

  it('1990-09-09: day master is 임(壬水)', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    expect(chart.dayMaster.korean).toBe('임')
    expect(chart.dayMaster.element).toBe('water')
  })

  it('hour pillar at 13:00 uses 未시(branch index 7)', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    expect(chart.hourPillar.branch.korean).toBe('미')
  })

  it('2026 세운 is 병오(丙午)', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    // 2026: (2026-4)%60 = 2022%60 = 42 → stem 42%10=2(병), branch 42%12=6(오)
    expect(chart.yearlyFlow.stem.korean).toBe('병')
    expect(chart.yearlyFlow.branch.korean).toBe('오')
  })

  it('luck cycles are 8 consecutive entries with 10-year spans', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    for (let i = 0; i < 7; i++) {
      expect(chart.luckCycles[i + 1]!.startAge - chart.luckCycles[i]!.startAge).toBe(10)
    }
  })

  it('ten gods are assigned on year, month, hour pillars', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    expect(chart.yearPillar.tenGod).toBeDefined()
    expect(chart.monthPillar.tenGod).toBeDefined()
    expect(chart.hourPillar.tenGod).toBeDefined()
  })

  it('engine version is set', () => {
    const chart = calculateSajuChart(birth1990, 2026)
    expect(chart.engineVersion).toMatch(/^\d+\.\d+\.\d+$/)
  })

  describe('Lunar input', () => {
    it('lunar 1990-07-20 converts and returns a chart', () => {
      const birth: BirthData = {
        year: 1990, month: 7, day: 20,
        hour: 12, minute: 0,
        gender: 'female',
        isLunar: true,
        isLeapMonth: false,
      }
      const chart = calculateSajuChart(birth, 2026)
      // Solar equivalent of 1990 lunar 7/20 = 1990-09-08 (one day before our reference)
      expect(chart.solarDate.year).toBe(1990)
      expect(chart.solarDate.month).toBe(9)
      expect(chart.dayMaster).toBeDefined()
    })
  })

  describe('Birth before Ipchun', () => {
    it('1990-01-15 uses 1989 saju year (기사년)', () => {
      const birth: BirthData = {
        year: 1990, month: 1, day: 15,
        hour: 10, minute: 0,
        gender: 'male',
        isLunar: false,
      }
      const chart = calculateSajuChart(birth, 2026)
      expect(chart.yearPillar.stem.korean).toBe('기')
      expect(chart.yearPillar.branch.korean).toBe('사')
    })
  })
})
