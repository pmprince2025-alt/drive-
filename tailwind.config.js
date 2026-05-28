/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#000000',
        'bg-surface': '#0A0A0A',
        'bg-elevated': '#141414',
        accent: '#39FF14',
        'accent-glow': 'rgba(57, 255, 20, 0.12)',
        'text-primary': '#E6EAF2',
        'text-secondary': '#8892A4',
        'text-muted': '#4A5568',
        success: '#22C55E',
        warning: '#FBBF24',
        error: '#F87171'
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backdropBlur: {
        glass: '20px'
      }
    }
  },
  plugins: []
}
