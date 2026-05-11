import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Element } from '../../saju-engine/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ELEMENT_COLORS: Record<Element, { bg: string; text: string; border: string; light: string }> = {
  wood:  { bg: 'bg-wood',  text: 'text-white', border: 'border-wood',  light: 'bg-wood-light' },
  fire:  { bg: 'bg-fire',  text: 'text-white', border: 'border-fire',  light: 'bg-fire-light' },
  earth: { bg: 'bg-earth', text: 'text-white', border: 'border-earth', light: 'bg-earth-light' },
  metal: { bg: 'bg-metal', text: 'text-white', border: 'border-metal', light: 'bg-metal-light' },
  water: { bg: 'bg-water', text: 'text-white', border: 'border-water', light: 'bg-water-light' },
}

export const ELEMENT_KOREAN: Record<Element, string> = {
  wood: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
}

export const TEN_GOD_DESCRIPTIONS: Record<string, string> = {
  '비견': '동료, 독립심, 경쟁의식',
  '겁재': '투쟁, 경쟁, 도전정신',
  '식신': '창의력, 표현력, 즐거움',
  '상관': '재능, 매력, 반골기질',
  '편재': '기회, 투자, 사업적 감각',
  '정재': '성실, 안정, 실물 자산',
  '편관': '압박, 도전, 추진력',
  '정관': '명예, 규칙, 책임감',
  '편인': '직관, 영성, 아이디어',
  '정인': '학습, 보호, 안정적 후원',
}

export function formatBirthData(
  year: number, month: number, day: number,
  hour: number, isLunar: boolean
): string {
  const calendarLabel = isLunar ? '음력' : '양력'
  const hourBranch = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
  const branchIdx = hour === 23 ? 0 : Math.floor((hour + 1) / 2)
  const timeLabel = hour === -1 ? '시간 미상' : `${hour}시 (${hourBranch[branchIdx]}시)`
  return `${year}년 ${month}월 ${day}일 ${timeLabel} | ${calendarLabel}`
}
