import { useRef, useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoom } from '../hooks/useRoom'
import { useSync } from '../hooks/useSync'
import VideoTile from '../components/VideoTile'
import Spinner from '../components/Spinner'

// Don't re-seek if clocks are within this many seconds of each other
const SYNC_TOLERANCE = 2

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function RoomPage() {
  const { code }     = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { room, loading, updateRoom } = useRoom(code)

  const videoRef     = useRef(null)
  const isSyncingRef = useRef(false) // prevents echo when applying partner's sync

  const [movieUrlInput, setMovieUrlInput] = useState('')
  const [videoError,    setVideoError]    = useState(false)
  const [duration,      setDuration]      = useState(0)
  const [currentTime,   setCurrentTime]   = useState(0)

  const isHost = room?.hostId === user?.uid

  // Apply sync messages that arrive from the partner via Daily
  const onSyncMessage = useCallback((data) => {
    const video = videoRef.current
    if (!video) return

    isSyncingRef.current = true

    switch (data.type) {
      case 'PLAY': {
        const diff = Math.abs(video.currentTime - data.currentTime)
        if (diff > SYNC_TOLERANCE) video.currentTime = data.currentTime
        video.play().catch(() => {})
        break
      }
      case 'PAUSE': {
        const diff = Math.abs(video.currentTime - data.currentTime)
        if (diff > SYNC_TOLERANCE) video.currentTime = data.currentTime
        video.pause()
        break
      }
      case 'SEEK':
        video.currentTime = data.currentTime
        break
      case 'LOAD':
        updateRoom({ movieUrl: data.movieUrl, currentTime: 0, isPlaying: false })
        break
    }

    setTimeout(() => { isSyncingRef.current = false }, 500)
  }, [updateRoom])

  const { joined, participants, sendSync, toggleMic, toggleCamera, isMicOn, isCameraOn } =
    useSync({
      dailyUrl:      room?.dailyUrl,
      onSyncMessage,
      userName:      user?.displayName ?? user?.email ?? 'User',
    })

  // Keep local URL input in sync with what host loads
  useEffect(() => {
    if (room?.movieUrl) setMovieUrlInput(room.movieUrl)
  }, [room?.movieUrl])

  // ── Video event handlers ────────────────────────────────────────────────
  const handlePlay = () => {
    if (isSyncingRef.current) return
    const t = videoRef.current?.currentTime ?? 0
    sendSync({ type: 'PLAY', currentTime: t })
    updateRoom({ isPlaying: true, currentTime: t })
  }

  const handlePause = () => {
    if (isSyncingRef.current) return
    const t = videoRef.current?.currentTime ?? 0
    sendSync({ type: 'PAUSE', currentTime: t })
    updateRoom({ isPlaying: false, currentTime: t })
  }

  const handleSeeked = () => {
    if (isSyncingRef.current) return
    const t = videoRef.current?.currentTime ?? 0
    sendSync({ type: 'SEEK', currentTime: t })
    updateRoom({ currentTime: t })
  }

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current?.currentTime ?? 0)
  }

  const handleSeekBar = (e) => {
    const t = Number(e.target.value)
    if (videoRef.current) videoRef.current.currentTime = t
  }

  const handleLoadMovie = () => {
    const url = movieUrlInput.trim()
    if (!url) return
    setVideoError(false)
    sendSync({ type: 'LOAD', movieUrl: url })
    updateRoom({ movieUrl: url, currentTime: 0, isPlaying: false })
  }

  const copyCode = () => navigator.clipboard.writeText(code)

  // ── Participants ────────────────────────────────────────────────────────
  const localParticipant  = Object.values(participants).find((p) => p.local)
  const remoteParticipant = Object.values(participants).find((p) => !p.local)

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) return <Spinner fullScreen />
  if (!room)   return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-primary text-lg hidden sm:block">
            CineSync
          </span>

          <button
            onClick={copyCode}
            title="Copy room code"
            className="flex items-center gap-2 bg-bg rounded-lg px-3 py-1.5 hover:shadow-card transition-shadow"
          >
            <span className="text-secondary text-xs">Room</span>
            <span className="font-mono font-bold text-primary tracking-widest text-sm">{code}</span>
            <span className="text-secondary text-xs">📋</span>
          </button>

          {!joined && (
            <span className="text-xs text-secondary animate-pulse">Connecting…</span>
          )}
        </div>

        <button onClick={() => navigate('/')} className="btn-ghost text-sm px-3 py-1.5">
          Leave
        </button>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4 min-h-0">

        {/* ── Video player column ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Player */}
          <div className="relative bg-black rounded-2xl overflow-hidden w-full aspect-video">
            {room.movieUrl ? (
              <video
                ref={videoRef}
                src={room.movieUrl}
                className="w-full h-full"
                onPlay={handlePlay}
                onPause={handlePause}
                onSeeked={handleSeeked}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onError={() => setVideoError(true)}
                playsInline
                controls={false}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/50">
                <span className="text-6xl">🎬</span>
                <p className="text-sm">
                  {isHost
                    ? 'Paste a movie URL below to start'
                    : 'Waiting for host to load a movie…'}
                </p>
              </div>
            )}

            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm text-center p-4">
                Could not load this video. Check that the URL points to a direct .mp4 or .webm file.
              </div>
            )}
          </div>

          {/* Seek bar + timestamps */}
          <div className="flex items-center gap-3 text-xs text-secondary">
            <span className="tabular-nums w-10 text-right">{fmt(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekBar}
              disabled={!room.movieUrl}
              className="flex-1 accent-[var(--color-accent)] cursor-pointer disabled:opacity-30"
            />
            <span className="tabular-nums w-10">{fmt(duration)}</span>
          </div>

          {/* Playback controls */}
          {room.movieUrl && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime -= 10
                }}
                className="btn-ghost px-3 py-2 text-sm"
                title="Back 10s"
              >
                ⏪ 10s
              </button>
              <button
                onClick={() => {
                  const v = videoRef.current
                  if (!v) return
                  v.paused ? v.play() : v.pause()
                }}
                className="btn-accent px-6 py-2 text-lg"
              >
                {videoRef.current?.paused !== false ? '▶' : '⏸'}
              </button>
              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime += 10
                }}
                className="btn-ghost px-3 py-2 text-sm"
                title="Forward 10s"
              >
                10s ⏩
              </button>
            </div>
          )}

          {/* Movie URL input — host only */}
          {isHost && (
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm font-mono"
                placeholder="Paste a direct video URL (.mp4, .webm, .mov…)"
                value={movieUrlInput}
                onChange={(e) => setMovieUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadMovie()}
              />
              <button onClick={handleLoadMovie} className="btn-accent whitespace-nowrap">
                Load
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:w-60 flex flex-row lg:flex-col gap-3 shrink-0">

          {/* Video tiles */}
          <div className="flex-1 lg:flex-none">
            <VideoTile
              participant={localParticipant}
              muted
              label={`${user.displayName ?? 'You'} (you)`}
            />
          </div>
          <div className="flex-1 lg:flex-none">
            <VideoTile
              participant={remoteParticipant}
              label={remoteParticipant ? 'Partner' : 'Waiting for partner…'}
            />
          </div>

          {/* Call controls */}
          <div className="flex lg:flex-col gap-2">
            <button
              onClick={toggleMic}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                isMicOn
                  ? 'bg-card border border-border text-primary hover:bg-card-raised'
                  : 'bg-red-500 text-white'
              }`}
            >
              {isMicOn ? '🎤 Mic on' : '🔇 Muted'}
            </button>
            <button
              onClick={toggleCamera}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                isCameraOn
                  ? 'bg-card border border-border text-primary hover:bg-card-raised'
                  : 'bg-red-500 text-white'
              }`}
            >
              {isCameraOn ? '📷 Cam on' : '🚫 Cam off'}
            </button>
          </div>

          {/* Room info */}
          <div className="card text-xs text-secondary space-y-1 hidden lg:block">
            <p>
              <span className="text-primary font-medium">You are: </span>
              {isHost ? 'Host (sets the movie)' : 'Guest'}
            </p>
            <p>
              <span className="text-primary font-medium">Partner: </span>
              {room.guestId && !isHost
                ? 'Connected'
                : room.guestId
                ? 'Guest joined'
                : 'Not joined yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
