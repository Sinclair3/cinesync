/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Dark mode is theme-scoped: only midnight-dark applies dark styling
  darkMode: ['selector', '[data-theme="midnight-dark"]'],
  theme: {
    extend: {
      colors: {
        bg:             'var(--color-bg)',
        card:           'var(--color-card)',
        'card-raised':  'var(--color-card-raised)',
        accent:         'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-muted': 'var(--color-accent-muted)',
        primary:        'var(--color-text)',
        secondary:      'var(--color-text-secondary)',
        border:         'var(--color-border)',
        overlay:        'var(--color-overlay)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl:  '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card:       '0 2px 12px var(--color-shadow)',
        'card-hover': '0 6px 24px var(--color-shadow-strong)',
      },
    },
  },
  plugins: [],
}
