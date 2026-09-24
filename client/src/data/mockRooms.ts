import type { RoomSummary } from '../game/types'

export const mockRooms: RoomSummary[] = [
  {
    roomId: 'DL-1001',
    status: 'waiting',
    players: [
      { id: 'p1', name: '春风', ready: true },
      { id: 'p2', name: '夏木', ready: false },
    ],
  },
  {
    roomId: 'DL-2048',
    status: 'playing',
    players: [
      { id: 'p3', name: '北海', ready: true },
      { id: 'p4', name: '星河', ready: true },
      { id: 'p5', name: '青石', ready: true },
    ],
  },
]
