export type Suit = '♠' | '♥' | '♣' | '♦'

export type Rank =
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'
  | '2'
  | 'SJ'
  | 'BJ'

export type PlayerRole = 'landlord' | 'farmer'
export type PlayerControl = 'human' | 'ai' | 'remote'
export type Phase = 'dealing' | 'bidding' | 'playing' | 'finished'

export interface Card {
  id: string
  rank: Rank
  value: number
  suit?: Suit
  label: string
}

export interface PlayerState {
  id: string
  name: string
  control: PlayerControl
  seat: number
  hand: Card[]
  role?: PlayerRole
  bid?: number
  passedLastTurn?: boolean
}

export interface PlayMove {
  playerId: string
  cards: Card[]
  type: HandType
  strength: number
  timestamp: number
}

export type HandType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'tripleWithSingle'
  | 'tripleWithPair'
  | 'straight'
  | 'pairStraight'
  | 'bomb'
  | 'rocket'
  | 'invalid'

export interface EvaluatedHand {
  type: HandType
  strength: number
  size: number
}

export interface GameState {
  deck: Card[]
  players: PlayerState[]
  bottomCards: Card[]
  landlordId?: string
  currentPlayerId: string
  phase: Phase
  highestBid: number
  highestBidderId?: string
  lastPlay?: PlayMove
  passCount: number
  winnerId?: string
  logs: string[]
  turn: number
}

export interface RoomSummary {
  roomId: string
  status: 'idle' | 'waiting' | 'playing'
  players: Array<{
    id: string
    name: string
    ready: boolean
  }>
}
