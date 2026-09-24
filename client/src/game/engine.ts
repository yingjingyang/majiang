import { chooseBid, chooseMove } from './ai'
import { createDeck, sortCards } from './cards'
import { canBeat, evaluateHand } from './evaluate'
import type { Card, GameState, PlayerState, PlayMove } from './types'

const playersSeed: Array<Pick<PlayerState, 'id' | 'name' | 'control' | 'seat'>> = [
  { id: 'human', name: '你', control: 'human', seat: 0 },
  { id: 'left-ai', name: '电脑甲', control: 'ai', seat: 1 },
  { id: 'right-ai', name: '电脑乙', control: 'ai', seat: 2 },
]

function createPlayers(): PlayerState[] {
  return playersSeed.map((player) => ({
    ...player,
    hand: [],
    bid: undefined,
    role: undefined,
    passedLastTurn: false,
  }))
}

function appendLog(state: GameState, message: string): GameState {
  return {
    ...state,
    logs: [message, ...state.logs].slice(0, 12),
  }
}

export function createInitialGame(): GameState {
  const deck = createDeck()
  const players = createPlayers()
  const bottomCards = deck.slice(-3)

  players.forEach((player, index) => {
    player.hand = sortCards(deck.slice(index * 17, (index + 1) * 17))
  })

  return {
    deck,
    players,
    bottomCards,
    currentPlayerId: players[0].id,
    phase: 'bidding',
    highestBid: 0,
    passCount: 0,
    logs: ['新的一局开始，请叫分。'],
    turn: 1,
  }
}

function nextPlayerId(players: PlayerState[], currentPlayerId: string): string {
  const currentIndex = players.findIndex((player) => player.id === currentPlayerId)
  const nextIndex = (currentIndex + 1) % players.length
  return players[nextIndex].id
}

export function submitBid(state: GameState, playerId: string, bid: number): GameState {
  if (state.phase !== 'bidding' || state.currentPlayerId !== playerId) {
    return state
  }

  const players = state.players.map((player) =>
    player.id === playerId ? { ...player, bid } : player,
  )

  const player = players.find((item) => item.id === playerId)
  const highestBid = bid > state.highestBid ? bid : state.highestBid
  const highestBidderId = bid > state.highestBid ? playerId : state.highestBidderId
  const everyoneBid = players.every((item) => item.bid !== undefined)

  let nextState: GameState = appendLog(
    {
      ...state,
      players,
      highestBid,
      highestBidderId,
      currentPlayerId: nextPlayerId(players, playerId),
    },
    `${player?.name ?? playerId} 叫了 ${bid} 分。`,
  )

  if (bid === 3 || everyoneBid) {
    const landlordId = highestBidderId ?? playerId

    nextState = assignLandlord(nextState, landlordId)
  }

  return nextState
}

function assignLandlord(state: GameState, landlordId: string): GameState {
  const players = state.players.map((player) => {
    if (player.id === landlordId) {
      return {
        ...player,
        role: 'landlord' as const,
        hand: sortCards([...player.hand, ...state.bottomCards]),
      }
    }

    return {
      ...player,
      role: 'farmer' as const,
    }
  })

  const landlord = players.find((player) => player.id === landlordId)

  return appendLog(
    {
      ...state,
      players,
      landlordId,
      currentPlayerId: landlordId,
      phase: 'playing',
      turn: 1,
      lastPlay: undefined,
      passCount: 0,
    },
    `${landlord?.name ?? landlordId} 成为地主，获得底牌。`,
  )
}

function removeCards(hand: Card[], playedCards: Card[]): Card[] {
  const ids = new Set(playedCards.map((card) => card.id))
  return hand.filter((card) => !ids.has(card.id))
}

export function playCards(state: GameState, playerId: string, cards: Card[]): GameState {
  if (state.phase !== 'playing' || state.currentPlayerId !== playerId || cards.length === 0) {
    return state
  }

  const player = state.players.find((item) => item.id === playerId)
  if (!player) {
    return state
  }

  const allowed = canBeat(cards, state.lastPlay?.playerId === playerId ? undefined : state.lastPlay?.cards)
  if (!allowed) {
    return appendLog(state, `${player.name} 的出牌不合法。`)
  }

  const evaluated = evaluateHand(cards)
  const updatedPlayers = state.players.map((item) =>
    item.id === playerId
      ? {
          ...item,
          hand: sortCards(removeCards(item.hand, cards)),
          passedLastTurn: false,
        }
      : { ...item, passedLastTurn: false },
  )

  const move: PlayMove = {
    playerId,
    cards,
    type: evaluated.type,
    strength: evaluated.strength,
    timestamp: Date.now(),
  }

  const winner = updatedPlayers.find((item) => item.id === playerId && item.hand.length === 0)

  let nextState: GameState = appendLog(
    {
      ...state,
      players: updatedPlayers,
      lastPlay: move,
      passCount: 0,
      currentPlayerId: nextPlayerId(updatedPlayers, playerId),
      turn: state.turn + 1,
    },
    `${player.name} 出了 ${cards.map((card) => card.label).join(' ')}。`,
  )

  if (winner) {
    nextState = appendLog(
      {
        ...nextState,
        phase: 'finished',
        winnerId: winner.id,
      },
      `${winner.name} 获胜！`,
    )
  }

  return nextState
}

export function passTurn(state: GameState, playerId: string): GameState {
  if (state.phase !== 'playing' || state.currentPlayerId !== playerId || !state.lastPlay) {
    return state
  }

  const updatedPlayers = state.players.map((player) =>
    player.id === playerId ? { ...player, passedLastTurn: true } : player,
  )

  const nextPassCount = state.passCount + 1
  const resetRound = nextPassCount >= updatedPlayers.length - 1

  let nextState: GameState = appendLog(
    {
      ...state,
      players: updatedPlayers,
      currentPlayerId: nextPlayerId(updatedPlayers, playerId),
      passCount: resetRound ? 0 : nextPassCount,
      lastPlay: resetRound ? undefined : state.lastPlay,
      turn: state.turn + 1,
    },
    `${updatedPlayers.find((player) => player.id === playerId)?.name ?? playerId} 选择不出。`,
  )

  if (resetRound) {
    nextState = appendLog(nextState, '其余玩家都过牌，重新开始新一轮出牌。')
  }

  return nextState
}

export function runAiTurn(state: GameState): GameState {
  const player = state.players.find((item) => item.id === state.currentPlayerId)

  if (!player || player.control !== 'ai') {
    return state
  }

  if (state.phase === 'bidding') {
    return submitBid(state, player.id, chooseBid(player.hand))
  }

  if (state.phase === 'playing') {
    const move = chooseMove(state, player.id)
    if (move.length === 0) {
      return passTurn(state, player.id)
    }

    return playCards(state, player.id, move)
  }

  return state
}
