import type { Pillar, ElementDistribution, ElementBalance } from '../types'

/**
 * Computes Five Elements distribution across all four pillars.
 * Each stem contributes 1.0 to its element.
 * Each branch contributes via its hidden stems (지장간) with weighted values.
 */
export function calcElementDistribution(
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  hourPillar: Pillar,
): ElementDistribution {
  const scores: ElementDistribution = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

  for (const pillar of [yearPillar, monthPillar, dayPillar, hourPillar]) {
    scores[pillar.stem.element] += 1.0
    for (const hs of pillar.branch.hiddenStems) {
      scores[hs.stem.element] += hs.weight
    }
  }

  return scores
}

/**
 * Determines whether the Day Master is strong (신강) or weak (신약).
 * Considers the Day Master's element score vs total score.
 *
 * Thresholds (conventional rules):
 *  strong   > 35% of total
 *  weak     < 15% of total
 *  moderate otherwise
 */
export function calcElementBalance(
  distribution: ElementDistribution,
  dayMasterElement: string,
): ElementBalance {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0)
  if (total === 0) return 'moderate'
  const dmScore = distribution[dayMasterElement as keyof ElementDistribution] ?? 0
  const ratio = dmScore / total
  if (ratio > 0.35) return 'strong'
  if (ratio < 0.15) return 'weak'
  return 'moderate'
}
