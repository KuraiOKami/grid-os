/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // GridOS color palette — dark corporate OS aesthetic
        grid: {
          bg:         '#0a0a0f',
          surface:    '#111118',
          surface2:   '#16161f',
          border:     '#2a2a3a',
          text:       '#c8c8d8',
          muted:      '#6b6b80',
          faint:      '#3a3a4a',
          accent:     '#00e5ff',   // GridOS cyan — corporate brand color
          accentDim:  '#0099aa',
          danger:     '#ff3b5c',
          warn:       '#ffaa00',
          success:    '#00cc88',
          purple:     '#9b5de5',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        ui:   ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan':   '0 0 12px rgba(0, 229, 255, 0.25)',
        'glow-danger': '0 0 12px rgba(255, 59, 92, 0.25)',
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'blink':    'blink 1s step-end infinite',
        'boot':     'boot 0.4s ease-out',
      },
      keyframes: {
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        boot: {
          '0%':   { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
