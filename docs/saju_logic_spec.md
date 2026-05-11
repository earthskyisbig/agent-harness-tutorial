# Saju Logic Specification

> Version 1.0 | Status: Planning | Last Updated: 2026-05-12

---

## 1. Overview

This document specifies the complete deterministic calculation logic for the Saju Engine. Every value in the engine is derived mathematically or from authoritative lookup tables. No interpretation or inference occurs inside the engine — it only produces structured data.

**Inputs:** `BirthData` (date, time, gender, calendar type)  
**Outputs:** `SajuChart` (four pillars, five elements, ten gods, luck cycles, balance)

---

## 2. Heavenly Stems (천간, Cheon-gan)

Ten heavenly stems cycle through years, months, days, and hours.

| Index | Stem | Korean | Element | Polarity | Hanja |
|---|---|---|---|---|---|
| 0 | Gab | 갑 | Wood | Yang (+) | 甲 |
| 1 | Eul | 을 | Wood | Yin  (−) | 乙 |
| 2 | Byeong | 병 | Fire | Yang (+) | 丙 |
| 3 | Jeong | 정 | Fire | Yin  (−) | 丁 |
| 4 | Mu | 무 | Earth | Yang (+) | 戊 |
| 5 | Gi | 기 | Earth | Yin  (−) | 己 |
| 6 | Gyeong | 경 | Metal | Yang (+) | 庚 |
| 7 | Sin | 신 | Metal | Yin  (−) | 辛 |
| 8 | Im | 임 | Water | Yang (+) | 壬 |
| 9 | Gye | 계 | Water | Yin  (−) | 癸 |

**Year Stem formula:**  
```
yearStemIndex = (gregorianYear - 4) % 10
```
Example: 1990 → (1990 − 4) % 10 = 6 → 경 (庚, Yang Metal)

---

## 3. Earthly Branches (지지, Ji-ji)

Twelve earthly branches correspond to months, years, hours, and animals.

| Index | Branch | Korean | Animal | Element | Polarity | Hours (KST) | Hanja |
|---|---|---|---|---|---|---|---|
| 0 | Ja | 자 | Rat | Water | Yang | 23:00–00:59 | 子 |
| 1 | Chuk | 축 | Ox | Earth | Yin | 01:00–02:59 | 丑 |
| 2 | In | 인 | Tiger | Wood | Yang | 03:00–04:59 | 寅 |
| 3 | Myo | 묘 | Rabbit | Wood | Yin | 05:00–06:59 | 卯 |
| 4 | Jin | 진 | Dragon | Earth | Yang | 07:00–08:59 | 辰 |
| 5 | Sa | 사 | Snake | Fire | Yin | 09:00–10:59 | 巳 |
| 6 | O | 오 | Horse | Fire | Yang | 11:00–12:59 | 午 |
| 7 | Mi | 미 | Goat | Earth | Yin | 13:00–14:59 | 未 |
| 8 | Sin | 신 | Monkey | Metal | Yang | 15:00–16:59 | 申 |
| 9 | Yu | 유 | Rooster | Metal | Yin | 17:00–18:59 | 酉 |
| 10 | Sul | 술 | Dog | Earth | Yang | 19:00–20:59 | 戌 |
| 11 | Hae | 해 | Pig | Water | Yin | 21:00–22:59 | 亥 |

**Year Branch formula:**  
```
yearBranchIndex = (gregorianYear - 4) % 12
```
Example: 1990 → (1990 − 4) % 12 = 10 → 오 (午, Horse)

---

## 4. The 60 Gapja Cycle (육십갑자)

The LCM of 10 stems and 12 branches is 60. The complete ordered list:

| # | Stem | Branch | Name | Element |
|---|---|---|---|---|
| 1 | 甲 | 子 | 갑자 | Yang Wood / Yang Water |
| 2 | 乙 | 丑 | 을축 | Yin Wood / Yin Earth |
| 3 | 丙 | 寅 | 병인 | Yang Fire / Yang Wood |
| 4 | 丁 | 卯 | 정묘 | Yin Fire / Yin Wood |
| 5 | 戊 | 辰 | 무진 | Yang Earth / Yang Earth |
| 6 | 己 | 巳 | 기사 | Yin Earth / Yin Fire |
| 7 | 庚 | 午 | 경오 | Yang Metal / Yang Fire |
| 8 | 辛 | 未 | 신미 | Yin Metal / Yin Earth |
| 9 | 壬 | 申 | 임신 | Yang Water / Yang Metal |
| 10 | 癸 | 酉 | 계유 | Yin Water / Yin Metal |
| 11 | 甲 | 戌 | 갑술 | Yang Wood / Yang Earth |
| 12 | 乙 | 亥 | 을해 | Yin Wood / Yin Water |
| … | … | … | … | … |
| 60 | 癸 | 亥 | 계해 | Yin Water / Yin Water |

**60 Gapja index formula:**  
```
gapjaIndex = ((year - 4) % 60 + 60) % 60
```

---

## 5. Solar Terms (절기, Jeolgi)

The Month Pillar is determined by **solar terms**, NOT by the lunar calendar month. There are 24 solar terms per year; the Saju engine uses the 12 "major" terms that mark the start of each Saju month.

| Month # | Term | Korean | Approx. Date | Branch |
|---|---|---|---|---|
| 1 | Ipchun | 입춘 | Feb 4 | 寅 (in) |
| 2 | Gyeongchip | 경칩 | Mar 6 | 卯 (myo) |
| 3 | Cheonmyeong | 청명 | Apr 5 | 辰 (jin) |
| 4 | Ipha | 입하 | May 6 | 巳 (sa) |
| 5 | Mangjeong | 망종 | Jun 6 | 午 (o) |
| 6 | Soseo | 소서 | Jul 7 | 未 (mi) |
| 7 | Ipchu | 입추 | Aug 7 | 申 (sin) |
| 8 | Baengno | 백로 | Sep 8 | 酉 (yu) |
| 9 | Hallo | 한로 | Oct 8 | 戌 (sul) |
| 10 | Ipdong | 입동 | Nov 7 | 亥 (hae) |
| 11 | Daesol | 대설 | Dec 7 | 子 (ja) |
| 12 | Sohan | 소한 | Jan 5 | 丑 (chuk) |

**Implementation note:** The exact solar term timestamp (to the minute) must be pre-computed and stored in the `solar_terms` database table for years 1900–2100, or computed algorithmically using VSOP87 longitude calculations. The database table approach is preferred for reliability.

### Month Stem Derivation (월간 결정법)

Month stem depends on the Year Stem:

| Year Stem | Month 1 (寅) | Month 2 (卯) | … | Pattern |
|---|---|---|---|---|
| 甲 / 己 | 丙寅 | 丁卯 | … | Starts at 丙 |
| 乙 / 庚 | 戊寅 | 己卯 | … | Starts at 戊 |
| 丙 / 辛 | 庚寅 | 辛卯 | … | Starts at 庚 |
| 丁 / 壬 | 壬寅 | 癸卯 | … | Starts at 壬 |
| 戊 / 癸 | 甲寅 | 乙卯 | … | Starts at 甲 |

```typescript
const MONTH_STEM_BASE: Record<number, number> = {
  0: 2, // 갑 → 丙 (index 2)
  5: 2, // 기 → 丙
  1: 4, // 을 → 戊
  6: 4, // 경 → 戊
  2: 6, // 병 → 庚
  7: 6, // 신 → 庚
  3: 8, // 정 → 壬
  8: 8, // 임 → 壬
  4: 0, // 무 → 甲
  9: 0, // 계 → 甲
};

function monthStemIndex(yearStemIndex: number, sajuMonthNumber: number): number {
  const base = MONTH_STEM_BASE[yearStemIndex];
  return (base + (sajuMonthNumber - 1)) % 10;
}
```

---

## 6. Four Pillars Calculation (사주팔자 계산)

### 6.1 Year Pillar (년주, Yeonju)

The Saju year begins at **Ipchun (입춘)**, not January 1st.

```typescript
function yearPillar(solarDate: SolarDate): Pillar {
  // Adjust year: if before Ipchun of that year, use previous year
  const sajuYear = isBeforeIpchun(solarDate) ? solarDate.year - 1 : solarDate.year;
  const stemIdx  = ((sajuYear - 4) % 10 + 10) % 10;
  const branchIdx = ((sajuYear - 4) % 12 + 12) % 12;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}
```

### 6.2 Month Pillar (월주, Wolju)

Determined by which solar term boundary the birth date falls after.

```typescript
function monthPillar(solarDate: SolarDate, yearPillar: Pillar): Pillar {
  const sajuMonth = getSajuMonthNumber(solarDate);  // 1–12 from solar term table
  const branchIdx = MONTH_BRANCH_MAP[sajuMonth];    // 寅=2 for month 1, etc.
  const stemIdx   = monthStemIndex(yearPillar.stem.index, sajuMonth);
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}
```

### 6.3 Day Pillar (일주, Ilju)

Calculated from Julian Day Number (JDN), which gives a continuous integer count from noon UT.

```typescript
function dayGapjaIndex(year: number, month: number, day: number): number {
  // Convert to Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5)
            + 365 * y + Math.floor(y / 4)
            - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  // JDN 0 corresponds to gapja index 40 (甲子 = 0, offset by 40 for JDN epoch)
  return ((jdn - 11) % 60 + 60) % 60;
}

function dayPillar(solarDate: SolarDate): Pillar {
  const idx = dayGapjaIndex(solarDate.year, solarDate.month, solarDate.day);
  return {
    stem:   STEMS[idx % 10],
    branch: BRANCHES[idx % 12],
  };
}
```

> **Verification:** 1990년 9월 9일 (solar) → Day Pillar: 壬午 (임오). Must be included in the test suite.

### 6.4 Hour Pillar (시주, Siju)

Hour branch comes from the KST hour; hour stem from the Day Stem.

```typescript
function hourBranchIndex(kstHour: number, kstMinute: number): number {
  // 子 starts at 23:00, so normalize
  const minutesFromMidnight = kstHour * 60 + kstMinute;
  if (minutesFromMidnight >= 23 * 60 || minutesFromMidnight < 1 * 60) return 0; // 子
  return Math.floor((minutesFromMidnight - 60) / 120) + 1;
}

const HOUR_STEM_BASE: Record<number, number> = {
  0: 0, 5: 0,  // 갑/기 → 甲子시
  1: 2, 6: 2,  // 을/경 → 丙子시
  2: 4, 7: 4,  // 병/신 → 戊子시
  3: 6, 8: 6,  // 정/임 → 庚子시
  4: 8, 9: 8,  // 무/계 → 壬子시
};

function hourPillar(kstHour: number, kstMinute: number, dayStem: HeavenlyStem): Pillar {
  const branchIdx = hourBranchIndex(kstHour, kstMinute);
  const stemIdx   = (HOUR_STEM_BASE[dayStem.index] + branchIdx) % 10;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}
```

---

## 7. Five Elements Analysis (오행 분석)

### 7.1 Element Assignment

Each stem and branch has a primary element. Branches also have hidden stems (지장간) contributing fractional element weights.

**Hidden Stems (지장간) by branch:**

| Branch | Main (%) | Mid (%) | Residual (%) |
|---|---|---|---|
| 子 | 癸 100% | — | — |
| 丑 | 己 60% | 癸 30% | 辛 10% |
| 寅 | 甲 60% | 丙 30% | 戊 10% |
| 卯 | 乙 100% | — | — |
| 辰 | 戊 60% | 乙 30% | 癸 10% |
| 巳 | 丙 60% | 庚 30% | 戊 10% |
| 午 | 丁 60% | 己 40% | — |
| 未 | 己 60% | 丁 30% | 乙 10% |
| 申 | 庚 60% | 壬 30% | 戊 10% |
| 酉 | 辛 100% | — | — |
| 戌 | 戊 60% | 辛 30% | 丁 10% |
| 亥 | 壬 60% | 甲 30% | — ... |

### 7.2 Element Scoring

```typescript
function computeElementDistribution(chart: RawPillars): ElementDistribution {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  // Score stems (weight: 1.0 each)
  for (const pillar of [chart.year, chart.month, chart.day, chart.hour]) {
    scores[pillar.stem.element] += 1.0;
    // Score hidden stems of branch
    for (const hs of HIDDEN_STEMS[pillar.branch.index]) {
      scores[hs.stem.element] += hs.weight;
    }
  }
  return scores;
}
```

### 7.3 Generating and Controlling Cycles (상생상극)

```
Generating (상생):  木→火→土→金→水→木
Controlling (상극): 木→土→水→火→金→木
```

**Balance analysis rules:**
- A Day Master element with a score < 15% is **weak** (신약)
- A Day Master element with a score > 35% is **strong** (신강)
- The AI uses this classification as a key interpretive anchor.

---

## 8. Ten Gods (십성, Sipcheong)

Ten Gods describe the relationship between each stem/branch and the **Day Master (일간)**.

### 8.1 Derivation Logic

| Relationship | Same Polarity | Different Polarity |
|---|---|---|
| Same element as DM | 비견 (Bijeon) | 겁재 (Geopjae) |
| DM generates | 식신 (Sikshin) | 상관 (Sanggwan) |
| DM controls | 편재 (Pyeonjae) | 정재 (Jeongjae) |
| Controls DM | 편관 (Pyeongwan) | 정관 (Jeonggwan) |
| Generates DM | 편인 (Pyeonin) | 정인 (Jeongin) |

```typescript
function deriveTenGod(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGod {
  const dmElem   = dayMaster.element;
  const tgtElem  = target.element;
  const samePolarity = dayMaster.polarity === target.polarity;

  if (dmElem === tgtElem)                         return samePolarity ? '비견' : '겁재';
  if (GENERATING_CYCLE[dmElem] === tgtElem)       return samePolarity ? '식신' : '상관';
  if (CONTROLLING_CYCLE[dmElem] === tgtElem)      return samePolarity ? '편재' : '정재';
  if (CONTROLLING_CYCLE[tgtElem] === dmElem)      return samePolarity ? '편관' : '정관';
  if (GENERATING_CYCLE[tgtElem] === dmElem)       return samePolarity ? '편인' : '정인';

  throw new Error(`Cannot derive Ten God: ${dmElem} → ${tgtElem}`);
}
```

### 8.2 Ten Gods Meaning Summary (for AI prompt context)

| Ten God | Hanja | Core Meaning | Positive Trait | Shadow Trait |
|---|---|---|---|---|
| 비견 | 比肩 | Peer, equal | Independence, drive | Stubbornness |
| 겁재 | 劫財 | Rival | Competitive spirit | Aggressiveness |
| 식신 | 食神 | Output | Creativity, enjoyment | Complacency |
| 상관 | 傷官 | Talent | Brilliance, charm | Rebelliousness |
| 편재 | 偏財 | Windfall wealth | Entrepreneurship | Gambling tendency |
| 정재 | 正財 | Stable wealth | Diligence, reliability | Rigidity |
| 편관 | 偏官 | Pressure/authority | Boldness | Stress |
| 정관 | 正官 | Official authority | Structure, reputation | Conformity |
| 편인 | 偏印 | Indirect resource | Intuition, spirituality | Overthinking |
| 정인 | 正印 | Direct resource | Learning, stability | Over-dependence |

---

## 9. Luck Cycles (대운, Daewoon)

대운 is a series of 10-year periods that overlay the natal chart. Each period is one consecutive gapja unit from the Month Pillar, progressing forward (for Yang male / Yin female) or backward (for Yin male / Yang female).

### 9.1 Starting Age Calculation

The starting age of the first 대운 is determined by the distance (in days) from birth to the nearest solar term:

```typescript
function luckCycleStartAge(
  birthDate: SolarDate,
  monthPillarSolarTerm: Date,
  gender: 'male' | 'female',
  yearStemPolarity: 'yang' | 'yin'
): number {
  const forward = (gender === 'male') === (yearStemPolarity === 'yang');
  const nextTerm = forward
    ? nextSolarTermAfter(birthDate)
    : prevSolarTermBefore(birthDate);

  const daysDiff = Math.abs(dateDiffDays(birthDate, nextTerm));
  // 3 days ≈ 1 year of starting age
  return Math.round(daysDiff / 3);
}
```

### 9.2 Cycle Generation

```typescript
function generateLuckCycles(
  monthPillar: Pillar,
  startAge: number,
  forward: boolean,
  count: number = 8
): LuckCycle[] {
  const cycles: LuckCycle[] = [];
  let gapjaIdx = pillarToGapjaIndex(monthPillar);

  for (let i = 0; i < count; i++) {
    gapjaIdx = forward
      ? (gapjaIdx + 1) % 60
      : ((gapjaIdx - 1) + 60) % 60;
    cycles.push({
      startAge: startAge + i * 10,
      endAge:   startAge + i * 10 + 9,
      pillar:   gapjaIndexToPillar(gapjaIdx),
      tenGod:   deriveTenGodForBranch(dayMaster, gapjaIndexToPillar(gapjaIdx)),
    });
  }
  return cycles;
}
```

---

## 10. Yearly Flow (세운, Sewoon)

세운 is the gapja of the current calendar year, applied as an overlay on both the natal chart and the active 대운. It creates temporary influences lasting one year.

```typescript
function yearlyFlow(gregorianYear: number): Pillar {
  const idx = ((gregorianYear - 4) % 60 + 60) % 60;
  return gapjaIndexToPillar(idx);
}
```

**AI interpretation uses:** natal chart + active 대운 + 세운 together to produce year-specific guidance.

---

## 11. Lunar ↔ Solar Calendar Conversion

Korean Saju traditionally uses solar dates internally (after the month pillar solar term boundary). However, users may input dates in the **lunar calendar (음력)**.

### Strategy
- Maintain a pre-built lookup table for lunar→solar mapping from 1900–2100.
- Table stored in `solar_terms` and `lunar_calendar` tables in PostgreSQL.
- Algorithm fallback: use Korean Astronomical Research Institute (KARI) validated data.
- Support **leap months (윤달)**: store `isLeapMonth` flag and resolve to correct solar date.

### Validation
- Every conversion must be verifiable against KARI official calendar data.
- The test suite includes 200+ known lunar↔solar pairs.

---

## 12. Data Structures (TypeScript)

```typescript
type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
type Polarity = 'yang' | 'yin';

interface HeavenlyStem {
  index: number;      // 0–9
  korean: string;     // 갑, 을, …
  hanja: string;      // 甲, 乙, …
  element: Element;
  polarity: Polarity;
}

interface EarthlyBranch {
  index: number;      // 0–11
  korean: string;
  hanja: string;
  animal: string;
  element: Element;
  polarity: Polarity;
  hiddenStems: HiddenStem[];
}

interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  tenGod?: TenGod;    // relative to Day Master
}

interface SajuChart {
  birthData: BirthData;
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;          // stem = Day Master
  hourPillar: Pillar;
  dayMaster: HeavenlyStem;
  elementDistribution: Record<Element, number>;
  elementBalance: 'strong' | 'moderate' | 'weak';
  tenGods: Record<string, TenGod>;
  luckCycles: LuckCycle[];
  currentLuckCycle: LuckCycle;
  yearlyFlow: Pillar;
  specialFormations: SpecialFormation[];
}
```
