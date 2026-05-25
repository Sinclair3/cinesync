import { useTheme } from '../hooks/useTheme'

const THEME_ICONS = {
  'sandy-warm':    '☀️',
  'midnight-dark': '🌙',
  'forest-green':  '🌿',
  'rose-pink':     '🌸',
}

export default function ThemeToggle() {
  const { themeId, setThemeId, themes } = useTheme()

  return (
    <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => setThemeId(theme.id)}
          title={theme.label}
          aria-label={`Switch to ${theme.label} theme`}
          className={[
            'w-8 h-8 rounded-lg text-sm transition-all duration-200 flex items-center justify-center',
            themeId === theme.id
              ? 'bg-accent text-white shadow-sm scale-105'
              : 'hover:bg-card-raised text-secondary',
          ].join(' ')}
        >
          {THEME_ICONS[theme.id]}
        </button>
      ))}
    </div>
  )
}
