import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'sandy-warm',    label: 'Sandy Warm',    dark: false },
  { id: 'midnight-dark', label: 'Midnight Dark',  dark: true  },
  { id: 'forest-green',  label: 'Forest Green',   dark: false },
  { id: 'rose-pink',     label: 'Rose Pink',      dark: false },
]

const STORAGE_KEY = 'cinesync-theme'
const DEFAULT_THEME = 'sandy-warm'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME
  )

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', themeId)

    const isDark = THEMES.find((t) => t.id === themeId)?.dark ?? false
    html.classList.toggle('dark', isDark)

    localStorage.setItem(STORAGE_KEY, themeId)
  }, [themeId])

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
