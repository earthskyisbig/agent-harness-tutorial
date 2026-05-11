export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water'
export type Polarity = 'yang' | 'yin'
export type Gender = 'male' | 'female'

export interface HeavenlyStem {
  index: number       // 0–9
  korean: string      // 갑,을,병,정,무,기,경,신,임,계
  hanja: string       // 甲,乙,丙,丁,戊,己,庚,辛,壬,癸
  element: Element
  polarity: Polarity
}

export interface HiddenStem {
  stem: HeavenlyStem
  weight: number      // fractional contribution to element score
}

export interface EarthlyBranch {
  index: number       // 0–11
  korean: string
  hanja: string
  animal: string
  element: Element
  polarity: Polarity
  hourStart: number   // KST hour range start (23 for 子)
  hourEnd: number     // KST hour range end (exclusive)
  hiddenStems: HiddenStem[]
}

export type TenGod =
  | '비견' | '겁재'
  | '식신' | '상관'
  | '편재' | '정재'
  | '편관' | '정관'
  | '편인' | '정인'

export interface Pillar {
  stem: HeavenlyStem
  branch: EarthlyBranch
  tenGod?: TenGod
}

export type ElementDistribution = Record<Element, number>

export type ElementBalance = 'strong' | 'moderate' | 'weak'

export interface LuckCycle {
  startAge: number
  endAge: number
  pillar: Pillar
  tenGod: TenGod
}

export interface BirthData {
  year: number
  month: number
  day: number
  hour: number    // 0–23 KST
  minute: number  // 0–59
  gender: Gender
  isLunar: boolean
  isLeapMonth?: boolean
}

export interface SolarDate {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export interface SajuChart {
  birthData: BirthData
  solarDate: SolarDate          // resolved solar date
  yearPillar: Pillar
  monthPillar: Pillar
  dayPillar: Pillar
  hourPillar: Pillar
  dayMaster: HeavenlyStem       // 일간
  elementDistribution: ElementDistribution
  elementBalance: ElementBalance
  luckCycleStartAge: number
  luckCycles: LuckCycle[]
  currentYear: number
  yearlyFlow: Pillar            // 세운
  engineVersion: string
}
