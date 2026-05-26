import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createRoom, joinRoom, generateRoomCode } from '../utils/rooms'
import ThemeToggle from '../components/ThemeToggle'

const ERROR_MESSAGES = {
  'room-not-found': 'Room not found. Check the code and try again.',
  'room-full':      'That room is already full.',
  default:          'Something went wrong. Please try again.',
}

export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [joinCode, setJoinCode] = useState('')
  const [error, setError]       = useState(null)
  const [busy, setBusy]         = useState(false)

  const handleCreateRoom = async () => {
    try {
      setBusy(true)
      setError(null)
      const code = generateRoomCode()
      await createRoom(code, user.uid)
      navigate(`/room/${code}`)
    } catch {
      setError(ERROR_MESSAGES.default)
    } finally {
      setBusy(false)
    }
  }

  const handleJoinRoom = async () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Enter a 6-character room code.')
      return
    }
    try {
      setBusy(true)
      setError(null)
      await joinRoom(code, user.uid)
      navigate(`/room/${code}`)
    } catch (err) {
      setError(ERROR_MESSAGES[err.message] ?? ERROR_MESSAGES.default)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8 bg-bg">
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <span className="text-sm text-secondary hidden sm:block truncate max-w-[160px]">
          {user.displayName ?? user.email}
        </span>
        <ThemeToggle />
        <button onClick={signOut} className="btn-ghost text-sm px-3 py-1.5">
          Sign out
        </button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="font-display text-5xl font-bold text-primary">CineSync</h1>
        <p className="text-secondary">Your private cinema for two.</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2 max-w-xs text-center">
          {error}
        </p>
      )}

      <div className="w-full max-w-xs space-y-4">
        {/* Create Room */}
        <div className="card space-y-3">
          <div>
            <h2 className="font-semibold text-primary">Create a room</h2>
            <p className="text-secondary text-sm">Get a code to share with your partner.</p>
          </div>
          <button
            onClick={handleCreateRoom}
            disabled={busy}
            className="btn-accent w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Creating…' : 'Create Room'}
          </button>
        </div>

        <div className="flex items-center gap-3 text-secondary text-sm">
          <div className="flex-1 h-px bg-border" />
          or
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join Room */}
        <div className="card space-y-3">
          <div>
            <h2 className="font-semibold text-primary">Join a room</h2>
            <p className="text-secondary text-sm">Enter the 6-character code.</p>
          </div>
          <input
            className="input uppercase tracking-widest text-center font-mono"
            placeholder="ABC123"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
          />
          <button
            onClick={handleJoinRoom}
            disabled={busy || joinCode.length === 0}
            className="btn-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Joining…' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  )
}
