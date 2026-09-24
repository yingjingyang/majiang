import type { Card, Rank, Suit } from './types'

const suits: Suit[] = ['♠', '♥', '♣', '♦']
const orderedRanks: Array<{ rank: Rank; value: number }> = [
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 11 },
  { rank: 'Q', value: 12 },
  { rank: 'K', value: 13 },
  { rank: 'A', value: 14 },
  { rank: '2', value: 15 },
]

function shuffle<T>(items: T[]): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

export function createDeck(): Card[] {
  const deck: Card[] = orderedRanks.flatMap(({ rank, value }) =>
    suits.map((suit) => ({
      id: `${rank}-${suit}`,
      rank,
      suit,
      value,
      label: `${suit}${rank}`,
    })),
  )

  deck.push({ id: 'joker-small', rank: 'SJ', value: 16, label: '小王' })
  deck.push({ id: 'joker-big', rank: 'BJ', value: 17, label: '大王' })

  return shuffle(deck)
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((left, right) => {
    if (left.value !== right.value) {
      return left.value - right.value
    }

    return left.label.localeCompare(right.label)
  })
}
