import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'
import ThemeToggle from '../components/ThemeToggle'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41.5 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  )
}

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={ROUTES.HOME} replace />

  const handleSignIn = async () => {
    try {
      setBusy(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError('Sign in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-sm space-y-8 text-center">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-bold text-primary">CineSync</h1>
          <p className="text-secondary text-sm">Watch movies together, apart.</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSignIn}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 bg-card-raised
                     border border-border rounded-xl px-5 py-3 font-semibold text-primary
                     hover:shadow-card active:scale-95 transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>

        <p className="text-xs text-secondary">
          Private app for two — invite only.
        </p>
      </div>
    </div>
  )
}
