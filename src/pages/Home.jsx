import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { ROUTES } from '../utils/constants'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center space-y-3 max-w-md">
        <h1 className="font-display text-5xl font-bold text-primary tracking-tight">
          CineSync
        </h1>
        <p className="text-secondary text-lg">
          Watch movies together, apart. Your private cinema for two.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to={ROUTES.AUTH} className="btn-accent text-center">
          Get Started
        </Link>
        <Link to={ROUTES.WATCHLIST} className="btn-ghost text-center">
          Our Watchlist
        </Link>
      </div>
    </div>
  )
}
