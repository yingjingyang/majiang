import type { Card, PlayerState } from '../game/types'

export function formatCards(cards: Card[]): string {
  return cards.map((card) => card.label).join(' ')
}

export function getPlayerLabel(player: PlayerState, currentPlayerId: string): string {
  const current = player.id === currentPlayerId ? '（当前）' : ''
  const role = player.role === 'landlord' ? '地主' : player.role === 'farmer' ? '农民' : '未定'
  return `${player.name}${current} · ${role} · ${player.hand.length} 张牌`
}
