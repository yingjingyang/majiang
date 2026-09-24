import { canBeat, evaluateHand } from './evaluate'
import { sortCards } from './cards'
import type { Card, GameState } from './types'

function combinations(cards: Card[], size: number): Card[][] {
  const result: Card[][] = []

  function walk(start: number, picked: Card[]) {
    if (picked.length === size) {
      result.push(picked)
      return
    }

    for (let index = start; index < cards.length; index += 1) {
      walk(index + 1, [...picked, cards[index]])
    }
  }

  walk(0, [])
  return result
}

function findPlayableMove(hand: Card[], currentCards?: Card[]): Card[] {
  const sorted = sortCards(hand)

  if (!currentCards || currentCards.length === 0) {
    return [sorted[0]]
  }

  for (let size = 1; size <= Math.min(5, sorted.length); size += 1) {
    const group = combinations(sorted, size)
      .filter((cards) => evaluateHand(cards).type !== 'invalid')
      .sort((left, right) => evaluateHand(left).strength - evaluateHand(right).strength)

    const found = group.find((cards) => canBeat(cards, currentCards))
    if (found) {
      return found
    }
  }

  const bombs = combinations(sorted, 4)
    .filter((cards) => evaluateHand(cards).type === 'bomb')
    .sort((left, right) => evaluateHand(left).strength - evaluateHand(right).strength)

  if (bombs[0] && canBeat(bombs[0], currentCards)) {
    return bombs[0]
  }

  const rocket = sorted.filter((card) => card.value >= 16)
  if (rocket.length === 2 && canBeat(rocket, currentCards)) {
    return rocket
  }

  return []
}

export function chooseBid(hand: Card[]): number {
  const highCards = hand.filter((card) => card.value >= 15).length
  const pairs = new Set(hand.map((card) => card.value)).size <= hand.length - 4

  if (highCards >= 3) {
    return 3
  }

  if (highCards >= 2 || pairs) {
    return 2
  }

  return 1
}

export function chooseMove(state: GameState, playerId: string): Card[] {
  const player = state.players.find((item) => item.id === playerId)

  if (!player) {
    return []
  }

  const lastCards =
    state.lastPlay && state.lastPlay.playerId !== playerId ? state.lastPlay.cards : undefined

  return findPlayableMove(player.hand, lastCards)
}
