import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ref, onValue, push } from 'firebase/database'
import { rtdb } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useRoom } from '../hooks/useRoom'
import { useSyncEngine } from '../hooks/useSyncEngine'
import { useTheme } from '../hooks/useTheme'
import Spinner from '../components/Spinner'

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '👏', '🔥', '😢']
const DURATION = 7200 // virtual 2-hour timeline

function formatTime(s) {
  const sec = Math.floor(s ?? 0)
  const m   = Math.floor(sec / 60)
  const ss  = (sec % 60).toString().padStart(2, '0')
  return `${m.toString().padStart(2, '0')}:${ss}`
}

function getInitials(name) {
  if (!name) return '??'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function getLocalTz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace(/_/g, ' ')
}

// ── SyncStatusPill ────────────────────────────────────────────────────────────
function SyncStatusPill({ status }) {
  const styles = {
    synced:   'bg-green-50 text-green-700 border-green-200',
    drifting: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] ?? styles.synced}`}>
      {status === 'synced' ? '● synced' : '● drifting'}
    </span>
  )
}

// ── UserAvatar ────────────────────────────────────────────────────────────────
function UserAvatar({ name, tz, isMe }) {
  return (
    <div className="flex flex-col items-center gap-0.5" title={name}>
      <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center ${isMe ? 'bg-accent' : 'bg-secondary'}`}>
        {getInitials(name)}
      </div>
      {tz && <span className="text-[10px] text-secondary leading-none">{tz}</span>}
    </div>
  )
}

// ── EmojiBurst ────────────────────────────────────────────────────────────────
function EmojiBurst({ bursts }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((b) => (
        <span
          key={b.id}
          className="emoji-burst"
          style={{ left: `${b.x}%`, bottom: 80 }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  )
}

// ── DraggablePiP ──────────────────────────────────────────────────────────────
// Uses Pointer Events API so it works on both mouse and touch.
function DraggablePiP({ url }) {
  const posRef   = useRef({ x: 16, y: 80 })
  const [pos, setPos] = useState({ x: 16, y: 80 })
  const dragging = useRef(false)
  const offset   = useRef({ x: 0, y: 0 })

  const syncPos = (p) => { posRef.current = p; setPos(p) }

  const onPointerDown = (e) => {
    dragging.current = true
    offset.current   = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    syncPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
  }

  const onPointerUp = () => { dragging.current = false }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ width: 160, height: 120, left: pos.x, top: pos.y }}
      className="fixed z-40 rounded-xl overflow-hidden shadow-card-hover border border-border
                 cursor-grab active:cursor-grabbing select-none touch-none"
    >
      {url ? (
        <iframe
          src={url}
          allow="camera; microphone; fullscreen; speaker"
          className="w-full h-full border-0"
          title="Video Call"
        />
      ) : (
        <div className="w-full h-full bg-card flex items-center justify-center text-secondary text-xs text-center px-2">
          Video call<br />connecting…
        </div>
      )}
    </div>
  )
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────
function ChatPanel({ messages, userId, chatInput, setChatInput, onSend, onEmoji, endRef }) {
  return (
    <div className="flex flex-col h-full min-h-[320px] lg:min-h-0 lg:flex-1">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-secondary pt-10">Say something ✨</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === userId
          if (msg.type === 'emoji') {
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <span className="text-2xl">{msg.text}</span>
              </div>
            )
          }
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <span className={`px-3 py-1.5 rounded-2xl text-sm max-w-[78%] ${
                isMine
                  ? 'bg-accent text-white rounded-br-sm'
                  : 'bg-card-raised text-primary rounded-bl-sm'
              }`}>
                {msg.text}
              </span>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Emoji bar */}
      <div className="flex justify-center gap-3 px-3 py-2 border-t border-border shrink-0">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            onClick={() => onEmoji(e)}
            className="text-xl hover:scale-125 transition-transform active:scale-90"
          >
            {e}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="flex gap-2 px-3 py-3 border-t border-border shrink-0">
        <input
          className="input flex-1 text-sm"
          placeholder="Say something…"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
        />
        <button onClick={onSend} className="btn-accent px-4 text-sm">
          →
        </button>
      </div>
    </div>
  )
}

// ── WatchRoomPage ─────────────────────────────────────────────────────────────
export default function WatchRoomPage() {
  const { code }  = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { room, loading, updateRoom } = useRoom(code)
  const { themeId, setThemeId, themes } = useTheme()

  const isHost = room?.hostId === user?.uid

  const syncEngine = useSyncEngine({ roomCode: code, userId: user.uid, isHost })

  // ── Virtual playback timer ────────────────────────────────────────────────
  const [localTime, setLocalTime] = useState(0)

  useEffect(() => {
    if (!syncEngine.isPlaying) return
    const id = setInterval(() => {
      setLocalTime((t) => {
        const next = t + 1
        syncEngine.updateLocalTime(next)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [syncEngine.isPlaying, syncEngine.updateLocalTime])

  // Apply remote seek position
  useEffect(() => {
    if (syncEngine.currentTime > 0) setLocalTime(syncEngine.currentTime)
  }, [syncEngine.currentTime])

  // ── Movie title & stream URL ──────────────────────────────────────────────
  const [titleInput,  setTitleInput]  = useState('')
  const [streamInput, setStreamInput] = useState('')

  useEffect(() => {
    if (room?.movieTitle) setTitleInput(room.movieTitle)
    if (room?.streamUrl)  setStreamInput(room.streamUrl)
  }, [room?.movieTitle, room?.streamUrl])

  const saveTitle  = () => { if (titleInput.trim())  updateRoom({ movieTitle: titleInput.trim() }) }
  const saveStream = () => { if (streamInput.trim()) updateRoom({ streamUrl: streamInput.trim() }) }

  const openStream = () => {
    const url = room?.streamUrl || streamInput.trim()
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  // ── Chat (Firebase RTDB) ──────────────────────────────────────────────────
  const [messages,  setMessages]  = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatOpen,  setChatOpen]  = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!code) return
    return onValue(ref(rtdb, `rooms/${code}/chat`), (snap) => {
      if (!snap.exists()) { setMessages([]); return }
      const msgs = Object.entries(snap.val())
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => a.timestamp - b.timestamp)
      setMessages(msgs)
    })
  }, [code])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const pushMessage = (text, type = 'text') =>
    push(ref(rtdb, `rooms/${code}/chat`), {
      text, type,
      senderId:   user.uid,
      senderName: user.displayName ?? user.email ?? 'User',
      timestamp:  Date.now(),
    })

  const handleSend = () => {
    if (!chatInput.trim()) return
    pushMessage(chatInput.trim())
    setChatInput('')
  }

  // ── Emoji burst ───────────────────────────────────────────────────────────
  const [bursts, setBursts] = useState([])

  const handleEmoji = (emoji) => {
    pushMessage(emoji, 'emoji')
    const newBursts = Array.from({ length: 3 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      emoji,
      x: 15 + Math.random() * 70,
    }))
    setBursts((prev) => [...prev, ...newBursts])
    setTimeout(
      () => setBursts((prev) => prev.filter((b) => !newBursts.some((n) => n.id === b.id))),
      1900,
    )
  }

  // ── Theme cycler (saves to localStorage via ThemeContext) ─────────────────
  const cycleTheme = () => {
    const idx = themes.findIndex((t) => t.id === themeId)
    setThemeId(themes[(idx + 1) % themes.length].id)
  }

  // ── Sync controls ─────────────────────────────────────────────────────────
  const handlePlay   = () => syncEngine.sendPlay(localTime)
  const handlePause  = () => syncEngine.sendPause(localTime)
  const handleSeek   = (t) => { setLocalTime(t); syncEngine.sendSeek(t) }
  const handleResync = () => syncEngine.sendResync(localTime)

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return <Spinner fullScreen />
  if (!room)   return <Navigate to="/" replace />

  const myName      = user.displayName ?? user.email ?? 'Me'
  const partnerName = isHost ? (room.guestId ? 'Partner' : 'Waiting…') : 'Host'

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bg text-primary">
      <EmojiBurst bursts={bursts} />
      <DraggablePiP url={room.dailyUrl} />

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-h-screen">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
          <input
            className="flex-1 min-w-0 bg-transparent font-display text-lg font-bold
                       text-primary placeholder:text-secondary focus:outline-none truncate"
            placeholder="Movie title…"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />

          <div className="flex items-center gap-3 shrink-0">
            <UserAvatar name={myName} tz={getLocalTz()} isMe />
            <UserAvatar name={partnerName} tz="" />
            <SyncStatusPill status={syncEngine.syncStatus} />
          </div>

          {/* Theme cycler — top right */}
          <button
            onClick={cycleTheme}
            title={`Theme: ${themeId}`}
            className="w-8 h-8 rounded-lg bg-bg border border-border text-sm
                       flex items-center justify-center hover:bg-card-raised transition-colors shrink-0"
          >
            🎨
          </button>

          <button
            onClick={() => navigate('/')}
            className="btn-ghost text-sm px-3 py-1.5 shrink-0"
          >
            Leave
          </button>
        </header>

        {/* URL bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-card-raised border-b border-border shrink-0">
          <input
            className="input flex-1 text-sm font-mono"
            placeholder="Paste streaming link (Netflix, YouTube, Disney+…)"
            value={streamInput}
            onChange={(e) => setStreamInput(e.target.value)}
            onBlur={saveStream}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          <button
            onClick={openStream}
            disabled={!streamInput && !room.streamUrl}
            className="btn-accent shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Open ↗
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6 px-4 py-8 flex-1 items-center justify-center">
          {/* Play / Pause / Resync */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button onClick={handlePlay} className="btn-accent flex items-center gap-2 px-8">
              ▶ Play
            </button>
            <button onClick={handlePause} className="btn-ghost flex items-center gap-2 px-8">
              ⏸ Pause
            </button>
            {isHost && (
              <button onClick={handleResync} className="btn-ghost flex items-center gap-2 px-5 text-sm">
                ↺ Resync
              </button>
            )}
          </div>

          {/* Seek slider */}
          <div className="flex items-center gap-3 w-full max-w-xl">
            <span className="text-xs text-secondary tabular-nums w-12 text-right">
              {formatTime(localTime)}
            </span>
            <input
              type="range"
              min={0}
              max={DURATION}
              step={1}
              value={localTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="flex-1 accent-[var(--color-accent)] cursor-pointer"
            />
            <span className="text-xs text-secondary tabular-nums w-12">
              {formatTime(DURATION)}
            </span>
          </div>

          <p className="text-xs text-secondary text-center max-w-sm">
            Hit Play together — the slider keeps you in sync. Seek to any position and your partner follows.
          </p>
        </div>

        {/* Mobile: chat toggle */}
        <div className="lg:hidden px-4 pb-4 shrink-0">
          <button onClick={() => setChatOpen((o) => !o)} className="btn-ghost w-full">
            {chatOpen ? '▼ Close Chat' : '💬 Open Chat'}
          </button>
        </div>

        {chatOpen && (
          <div className="lg:hidden border-t border-border">
            <ChatPanel
              messages={messages}
              userId={user.uid}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSend={handleSend}
              onEmoji={handleEmoji}
              endRef={chatEndRef}
            />
          </div>
        )}
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-80 border-l border-border bg-card shrink-0">
        <div className="px-4 py-3 border-b border-border shrink-0">
          <p className="text-sm font-semibold text-primary">Chat</p>
        </div>
        <ChatPanel
          messages={messages}
          userId={user.uid}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSend={handleSend}
          onEmoji={handleEmoji}
          endRef={chatEndRef}
        />
      </aside>
    </div>
  )
}
