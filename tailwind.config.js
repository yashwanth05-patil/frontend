/** @type {import('tailwindcss').Config } */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Guardian Instrument design tokens
        ink: '#0B1220',
        'ink-raised': '#141B2E',
        mist: '#F5F7FB',
        'mist-soft': '#B7C0D1',
        panel: '#161F32',
        'panel-raised': '#1B2640',
        slate: {
          DEFAULT: '#25314A',
          line: '#25314A',
        },
        amber: '#E8A33D',
        'amber-soft': '#4A3820',
        teal: '#2FBF9F',
        'teal-soft': '#123B35',
        signal: '#E5484D',
        'signal-soft': '#3A1A1D',

        // —— legacy semantic aliases so existing components adopt the dark theme
        paper: '#0B1220',
        'paper-raised': '#161F32',
        'ink-soft': '#B7C0D1', // secondary text = mist-soft
        dusk: '#E8A33D',
        'dusk-soft': '#4A3820',
        sage: '#2FBF9F',
        'sage-soft': '#123B35',
        // signal / signal-soft already defined above (SOS-only red)
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '1.05', fontWeight: '600' }],
        'display-sm': ['2rem', { lineHeight: '1.1', fontWeight: '600' }],
        heading: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['0.95rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.8rem', { lineHeight: '1.4', fontWeight: '500' }],
        'mono-data': ['0.8rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        btn: '12px',
        card: '12px',
        panel: '20px',
        pill: '999px',
      },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
      boxShadow: {
        nav: '0 8px 28px rgba(0, 0, 0, 0.45)',
        press: '0 6px 16px rgba(0, 0, 0, 0.55)',
        'dial-glow': '0 0 44px 4px rgba(232, 163, 61, 0.28)',
        'dial-live': '0 0 44px 4px rgba(229, 72, 77, 0.35)',
      },
      transitionDuration: { page: '250ms' },
      transitionTimingFunction: { page: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
  plugins: [],
}