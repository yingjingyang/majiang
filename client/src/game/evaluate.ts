import type { Card, EvaluatedHand } from './types'

function isSequential(values: number[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] !== values[index - 1] + 1) {
      return false
    }
  }

  return true
}

function getCounts(cards: Card[]) {
  const counts = new Map<number, number>()

  for (const card of cards) {
    counts.set(card.value, (counts.get(card.value) ?? 0) + 1)
  }

  return counts
}

export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length === 0) {
    return { type: 'invalid', strength: 0, size: 0 }
  }

  const sorted = [...cards].sort((left, right) => left.value - right.value)
  const values = sorted.map((card) => card.value)
  const uniqueValues = [...new Set(values)]
  const counts = [...getCounts(sorted).entries()].sort((left, right) => left[0] - right[0])

  if (cards.length === 1) {
    return { type: 'single', strength: values[0], size: 1 }
  }

  if (cards.length === 2) {
    if (values[0] === 16 && values[1] === 17) {
      return { type: 'rocket', strength: 99, size: 2 }
    }

    if (values[0] === values[1]) {
      return { type: 'pair', strength: values[0], size: 2 }
    }
  }

  if (cards.length === 3 && uniqueValues.length === 1) {
    return { type: 'triple', strength: values[0], size: 3 }
  }

  if (cards.length === 4) {
    if (uniqueValues.length === 1) {
      return { type: 'bomb', strength: values[0], size: 4 }
    }

    const triple = counts.find(([, count]) => count === 3)
    if (triple) {
      return { type: 'tripleWithSingle', strength: triple[0], size: 4 }
    }
  }

  if (cards.length === 5) {
    const hasTriple = counts.some(([, count]) => count === 3)
    const hasPair = counts.some(([, count]) => count === 2)

    if (hasTriple && hasPair) {
      const triple = counts.find(([, count]) => count === 3)
      return { type: 'tripleWithPair', strength: triple?.[0] ?? 0, size: 5 }
    }
  }

  const maxValue = Math.max(...values)
  const invalidForStraight = values.some((value) => value >= 15)

  if (cards.length >= 5 && !invalidForStraight && uniqueValues.length === cards.length && isSequential(values)) {
    return { type: 'straight', strength: maxValue, size: cards.length }
  }

  if (
    cards.length >= 6 &&
    cards.length % 2 === 0 &&
    !invalidForStraight &&
    counts.every(([, count]) => count === 2) &&
    isSequential(counts.map(([value]) => value))
  ) {
    return { type: 'pairStraight', strength: maxValue, size: cards.length }
  }

  return { type: 'invalid', strength: 0, size: cards.length }
}

export function canBeat(nextCards: Card[], currentCards?: Card[]): boolean {
  const next = evaluateHand(nextCards)

  if (next.type === 'invalid') {
    return false
  }

  if (!currentCards || currentCards.length === 0) {
    return true
  }

  const current = evaluateHand(currentCards)

  if (next.type === 'rocket') {
    return true
  }

  if (next.type === 'bomb' && current.type !== 'bomb') {
    return true
  }

  if (next.type !== current.type || next.size !== current.size) {
    return false
  }

  return next.strength > current.strength
}
