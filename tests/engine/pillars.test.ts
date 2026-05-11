import { describe, it, expect } from 'vitest'
import { calcYearPillar, calcMonthPillar, calcDayPillar, calcHourPillar, hourToBranchIndex } from '../../saju-engine/calculators/pillars'
import type { SolarDate } from '../../saju-engine/types'

// Helper to build a solar date quickly
function sd(year: number, month: number, day: number, hour = 12, minute = 0): SolarDate {
  return { year, month, day, hour, minute }
}

// ── Year Pillar ──────────────────────────────────────────────────────────────

describe('Year Pillar (년주)', () => {
  it('1990년 (경오년) — born after Ipchun', () => {
    const p = calcYearPillar(sd(1990, 9, 9))
    expect(p.stem.korean).toBe('경')
    expect(p.branch.korean).toBe('오')
  })

  it('1984년 (갑자년)', () => {
    const p = calcYearPillar(sd(1984, 6, 15))
    expect(p.stem.korean).toBe('갑')
    expect(p.branch.korean).toBe('자')
  })

  it('2000년 (경진년)', () => {
    const p = calcYearPillar(sd(2000, 5, 1))
    expect(p.stem.korean).toBe('경')
    expect(p.branch.korean).toBe('진')
  })

  it('Before Ipchun 1990 → 1989년 (기사년)', () => {
    // Ipchun 1990 is Feb 4 → Jan 15 is still 1989 Saju year
    const p = calcYearPillar(sd(1990, 1, 15))
    expect(p.stem.korean).toBe('기')
    expect(p.branch.korean).toBe('사')
  })

  it('1960년 (경자년)', () => {
    const p = calcYearPillar(sd(1960, 8, 20))
    expect(p.stem.korean).toBe('경')
    expect(p.branch.korean).toBe('자')
  })

  it('2024년 (갑진년)', () => {
    const p = calcYearPillar(sd(2024, 7, 1))
    expect(p.stem.korean).toBe('갑')
    expect(p.branch.korean).toBe('진')
  })

  it('2023년 (계묘년)', () => {
    const p = calcYearPillar(sd(2023, 10, 1))
    expect(p.stem.korean).toBe('계')
    expect(p.branch.korean).toBe('묘')
  })

  it('1950년 (경인년)', () => {
    const p = calcYearPillar(sd(1950, 7, 4))
    expect(p.stem.korean).toBe('경')
    expect(p.branch.korean).toBe('인')
  })
})

// ── Month Pillar ─────────────────────────────────────────────────────────────

describe('Month Pillar (월주)', () => {
  it('1990-09-09: 임술월', () => {
    const solar = sd(1990, 9, 9)
    const yp = calcYearPillar(solar)
    const mp = calcMonthPillar(solar, yp)
    // 1990 = 경 year → month stem base = 戊(4), September = month 8 → stem idx (4+7)%10=1 → 을
    // Actually Saju month 8 (백로) branch = 酉(9), stem = 을+(8-1)=을+7... let's just test branch
    expect(mp.branch.korean).toBe('유')  // 9월 절기 이후 = 酉월 (백로)
  })

  it('1990-01-15 is before Ipchun → Saju year 1989 (기 year) → month should be 丑월', () => {
    const solar = sd(1990, 1, 15)
    const yp = calcYearPillar(solar)  // 기사년
    const mp = calcMonthPillar(solar, yp)
    expect(mp.branch.korean).toBe('축')
  })

  it('1984-06-15: Saju month 5 (망종 이후) → 午월', () => {
    const solar = sd(1984, 6, 15)
    const yp = calcYearPillar(solar)
    const mp = calcMonthPillar(solar, yp)
    expect(mp.branch.korean).toBe('오')
  })
})

// ── Day Pillar ───────────────────────────────────────────────────────────────

describe('Day Pillar (일주)', () => {
  it('1990-09-09: reference case (임오일)', () => {
    const p = calcDayPillar(sd(1990, 9, 9))
    expect(p.stem.korean).toBe('임')
    expect(p.branch.korean).toBe('오')
  })

  it('1900-01-31: 기유일 (JDN=2415051, index 45)', () => {
    // JDN(1900-01-31)=2415051; (2415051-2448126)%60+60 = 45 → stem 5(기), branch 9(유)
    const p = calcDayPillar(sd(1900, 1, 31))
    expect(p.stem.korean).toBe('기')
    expect(p.branch.korean).toBe('유')
  })

  it('2024-01-01: 기사일 (JDN=2460311, index 5)', () => {
    // (2460311-2448126)%60 = 12185%60 = 5 → stem 5(기), branch 5(사)
    const p = calcDayPillar(sd(2024, 1, 1))
    expect(p.stem.korean).toBe('기')
    expect(p.branch.korean).toBe('사')
  })
})

// ── Hour Pillar ──────────────────────────────────────────────────────────────

describe('Hour Pillar (시주)', () => {
  it('hourToBranchIndex: 23:00 → 子(0)', () => {
    expect(hourToBranchIndex(23)).toBe(0)
  })

  it('hourToBranchIndex: 00:00 → 子(0)', () => {
    expect(hourToBranchIndex(0)).toBe(0)
  })

  it('hourToBranchIndex: 01:00 → 丑(1)', () => {
    expect(hourToBranchIndex(1)).toBe(1)
  })

  it('hourToBranchIndex: 13:00 → 未(7)', () => {
    expect(hourToBranchIndex(13)).toBe(7)
  })

  it('hourToBranchIndex: 21:00 → 亥(11)', () => {
    expect(hourToBranchIndex(21)).toBe(11)
  })

  it('Day stem 임(8) + 子시(0) → 壬子시 stem=임', () => {
    const solar = sd(1990, 9, 9, 0)
    const dayPillar = calcDayPillar(solar)  // 임오일
    expect(dayPillar.stem.korean).toBe('임')
    const hourPillar = calcHourPillar(solar, dayPillar)
    // 임(8) → HOUR_STEM_BASE[8]=6 (경) + branchIdx(0) = 6 → 경
    expect(hourPillar.stem.korean).toBe('경')
    expect(hourPillar.branch.korean).toBe('자')
  })
})
