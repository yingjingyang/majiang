import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { mockRooms } from './data/mockRooms'
import { createInitialGame, passTurn, playCards, runAiTurn, submitBid } from './game/engine'
import type { Card, GameState } from './game/types'
import { evaluateHand } from './game/evaluate'
import { formatCards, getPlayerLabel } from './utils/format'

type Mode = 'menu' | 'solo' | 'online'

function App() {
  const [mode, setMode] = useState<Mode>('menu')
  const [game, setGame] = useState<GameState>(() => createInitialGame())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [nickname, setNickname] = useState('游客玩家')

  const human = useMemo(
    () => game.players.find((player) => player.id === 'human') ?? game.players[0],
    [game.players],
  )
  const selectedCards = useMemo(
    () => human.hand.filter((card) => selectedIds.includes(card.id)),
    [human.hand, selectedIds],
  )
  const selectedHand = evaluateHand(selectedCards)
  const canPass = game.phase === 'playing' && game.currentPlayerId === human.id && Boolean(game.lastPlay)

  useEffect(() => {
    if (mode !== 'solo') {
      return
    }

    const currentPlayer = game.players.find((player) => player.id === game.currentPlayerId)
    if (!currentPlayer || currentPlayer.control !== 'ai' || game.phase === 'finished') {
      return
    }

    const timer = window.setTimeout(() => {
      setGame((current) => runAiTurn(current))
    }, 900)

    return () => window.clearTimeout(timer)
  }, [game, mode])

  useEffect(() => {
    setSelectedIds([])
  }, [game.currentPlayerId, game.phase])

  function startSoloGame() {
    setGame(createInitialGame())
    setSelectedIds([])
    setMode('solo')
  }

  function toggleCard(card: Card) {
    if (game.currentPlayerId !== human.id || game.phase !== 'playing') {
      return
    }

    setSelectedIds((current) =>
      current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id],
    )
  }

  function handleBid(bid: number) {
    setGame((current) => submitBid(current, human.id, bid))
  }

  function handlePlay() {
    if (selectedCards.length === 0) {
      return
    }

    setGame((current) => playCards(current, human.id, selectedCards))
    setSelectedIds([])
  }

  function handlePass() {
    setGame((current) => passTurn(current, human.id))
    setSelectedIds([])
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">欢乐斗地主 · 在线对战原型</p>
          <h1>一个能先玩起来的斗地主网站 MVP</h1>
          <p className="hero-copy">
            支持本地与电脑对战，并预留了在线房间大厅结构，后续可以直接接入 WebSocket
            联机服务。
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={startSoloGame}>
            开始人机对战
          </button>
          <button type="button" className="ghost-btn" onClick={() => setMode('online')}>
            查看联机大厅
          </button>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h2>已完成</h2>
          <ul>
            <li>54 张牌发牌与底牌</li>
            <li>叫地主流程</li>
            <li>单张、对子、三张、三带一、三带二、顺子、连对、炸弹、王炸</li>
            <li>基础 AI 跟牌与叫分</li>
          </ul>
        </article>
        <article className="feature-card">
          <h2>联机预留</h2>
          <ul>
            <li>房间列表结构</li>
            <li>游客昵称</li>
            <li>可扩展为 WebSocket 实时同步</li>
            <li>可继续加入匹配、断线重连、战绩系统</li>
          </ul>
        </article>
      </section>

      {mode === 'solo' && (
        <section className="table-layout">
          <div className="table-header">
            <div>
              <p className="table-title">当前模式：人机对战</p>
              <h2>
                {game.phase === 'bidding'
                  ? '叫地主阶段'
                  : game.phase === 'playing'
                    ? '出牌阶段'
                    : '本局结束'}
              </h2>
            </div>
            <div className="table-actions">
              <button type="button" className="ghost-btn" onClick={startSoloGame}>
                重新开局
              </button>
              <button type="button" className="ghost-btn" onClick={() => setMode('menu')}>
                返回首页
              </button>
            </div>
          </div>

          <div className="status-strip">
            <span>当前行动：{game.players.find((player) => player.id === game.currentPlayerId)?.name}</span>
            <span>最高叫分：{game.highestBid}</span>
            <span>底牌：{formatCards(game.bottomCards)}</span>
            {game.winnerId && (
              <span>
                胜者：{game.players.find((player) => player.id === game.winnerId)?.name}
              </span>
            )}
          </div>

          <div className="players-grid">
            {game.players.map((player) => (
              <article
                key={player.id}
                className={`player-card ${player.id === game.currentPlayerId ? 'current' : ''}`}
              >
                <h3>{getPlayerLabel(player, game.currentPlayerId)}</h3>
                <p>叫分：{player.bid ?? '-'}</p>
                <p>
                  手牌：
                  {player.id === human.id ? formatCards(player.hand) : `剩余 ${player.hand.length} 张`}
                </p>
              </article>
            ))}
          </div>

          <article className="play-area">
            <div>
              <p className="section-label">上一手出牌</p>
              <strong>
                {game.lastPlay
                  ? `${game.players.find((player) => player.id === game.lastPlay?.playerId)?.name}：${formatCards(game.lastPlay.cards)}`
                  : '本轮暂无出牌'}
              </strong>
            </div>
            <div>
              <p className="section-label">当前选牌</p>
              <strong>
                {selectedCards.length > 0
                  ? `${formatCards(selectedCards)} · 牌型：${selectedHand.type}`
                  : '尚未选择手牌'}
              </strong>
            </div>
          </article>

          {game.phase === 'bidding' && game.currentPlayerId === human.id && (
            <div className="action-row">
              {[1, 2, 3].map((bid) => (
                <button key={bid} type="button" className="primary-btn" onClick={() => handleBid(bid)}>
                  叫 {bid} 分
                </button>
              ))}
            </div>
          )}

          {game.phase === 'playing' && (
            <>
              <div className="card-row">
                {human.hand.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`poker-card ${selectedIds.includes(card.id) ? 'selected' : ''}`}
                    onClick={() => toggleCard(card)}
                  >
                    <span>{card.label}</span>
                  </button>
                ))}
              </div>

              <div className="action-row">
                <button type="button" className="primary-btn" onClick={handlePlay}>
                  出牌
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={handlePass}
                  disabled={!canPass}
                >
                  不出
                </button>
              </div>
            </>
          )}

          <article className="log-panel">
            <p className="section-label">对局日志</p>
            <ul>
              {game.logs.map((log) => (
                <li key={log}>{log}</li>
              ))}
            </ul>
          </article>
        </section>
      )}

      {mode === 'online' && (
        <section className="lobby-layout">
          <div className="lobby-header">
            <div>
              <p className="table-title">联机大厅原型</p>
              <h2>下一步可接入实时房间服务</h2>
            </div>
            <button type="button" className="ghost-btn" onClick={() => setMode('menu')}>
              返回首页
            </button>
          </div>

          <div className="nickname-card">
            <label htmlFor="nickname">你的昵称</label>
            <input
              id="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="输入昵称"
            />
          </div>

          <div className="room-list">
            {mockRooms.map((room) => (
              <article key={room.roomId} className="room-card">
                <div>
                  <h3>{room.roomId}</h3>
                  <p>状态：{room.status}</p>
                </div>
                <p>玩家：{room.players.map((player) => player.name).join('、')}</p>
                <button type="button" className="primary-btn">
                  以 {nickname || '游客'} 身份加入
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
