'use client'

import { useState } from 'react'
import { cn } from '../../lib/utils'
import type { BirthData } from '../../../saju-engine/types'

interface Props {
  onSubmit: (data: BirthData) => void | Promise<void>
  loading?: boolean
}

const HOUR_OPTIONS = [
  { value: 0,  label: '00시 (子시 ─ 자정)' },
  { value: 1,  label: '01시 (丑시)' },
  { value: 3,  label: '03시 (寅시)' },
  { value: 5,  label: '05시 (卯시)' },
  { value: 7,  label: '07시 (辰시)' },
  { value: 9,  label: '09시 (巳시)' },
  { value: 11, label: '11시 (午시)' },
  { value: 13, label: '13시 (未시)' },
  { value: 15, label: '15시 (申시)' },
  { value: 17, label: '17시 (酉시)' },
  { value: 19, label: '19시 (戌시)' },
  { value: 21, label: '21시 (亥시)' },
  { value: 23, label: '23시 (子시 ─ 밤)' },
]

export function BirthInputForm({ onSubmit, loading = false }: Props) {
  const [isLunar, setIsLunar]       = useState(false)
  const [isLeapMonth, setIsLeapMonth] = useState(false)
  const [gender, setGender]         = useState<'male' | 'female'>('male')
  const [year, setYear]             = useState('')
  const [month, setMonth]           = useState('')
  const [day, setDay]               = useState('')
  const [hour, setHour]             = useState<number | null>(null)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  function validate(): BirthData | null {
    const errs: Record<string, string> = {}
    const y = parseInt(year, 10)
    const m = parseInt(month, 10)
    const d = parseInt(day, 10)

    if (!year || isNaN(y) || y < 1900 || y > 2020) errs['year'] = '1900~2020 사이의 연도를 입력하세요.'
    if (!month || isNaN(m) || m < 1 || m > 12)      errs['month'] = '1~12 사이의 월을 입력하세요.'
    if (!day || isNaN(d) || d < 1 || d > 31)         errs['day'] = '1~31 사이의 일을 입력하세요.'

    setErrors(errs)
    if (Object.keys(errs).length > 0) return null

    return {
      year: y, month: m, day: d,
      hour:  hour ?? 12,
      minute: 0,
      gender,
      isLunar,
      isLeapMonth: isLunar ? isLeapMonth : undefined,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = validate()
    if (!data) return
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Calendar toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">달력 기준</label>
        <div className="flex gap-2">
          {(['양력', '음력'] as const).map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setIsLunar(i === 1)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                (i === 1) === isLunar
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
          {isLunar && (
            <label className="flex items-center gap-2 text-sm text-gray-600 ml-2">
              <input
                type="checkbox"
                checked={isLeapMonth}
                onChange={e => setIsLeapMonth(e.target.checked)}
                className="rounded"
              />
              윤달
            </label>
          )}
        </div>
      </div>

      {/* Birth date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          생년월일 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[
            { label: '년', value: year, setter: setYear, placeholder: '1990', err: errors['year'] },
            { label: '월', value: month, setter: setMonth, placeholder: '9', err: errors['month'] },
            { label: '일', value: day, setter: setDay, placeholder: '9', err: errors['day'] },
          ].map(({ label, value, setter, placeholder, err }) => (
            <div key={label} className="flex-1">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    err ? 'border-red-400' : 'border-gray-300'
                  )}
                />
                <span className="text-sm text-gray-600 shrink-0">{label}</span>
              </div>
              {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Birth time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">태어난 시간</label>
        <select
          value={hour ?? ''}
          onChange={e => setHour(e.target.value === '' ? null : parseInt(e.target.value, 10))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">시간 모름 (정오로 계산)</option>
          {HOUR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {hour === null && (
          <p className="text-xs text-gray-500 mt-1">시간을 모르면 정오(12시)로 계산됩니다. 시주는 참고용으로만 활용하세요.</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          성별 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {([['male', '남성'], ['female', '여성']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setGender(val)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                gender === val
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full py-3 rounded-xl text-white font-semibold text-base transition-colors',
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
        )}
      >
        {loading ? '계산 중...' : '사주 계산하기'}
      </button>
    </form>
  )
}
