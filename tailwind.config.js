/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F4EF',
        'paper-raised': '#FFFFFF',
        ink: '#141A2E',
        'ink-soft': '#4B5169',
        dusk: '#5B5F97',
        'dusk-soft': '#E8E8F2',
        sage: '#6E8F72',
        'sage-soft': '#E4EBE3',
        signal: '#E23F44',
        'signal-soft': '#FBE4E3',
        slate: {
          DEFAULT: '#DAD6CC',
          line: '#EFEDE6',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '1.05', fontWeight: '480' }],
        'display-sm': ['2rem', { lineHeight: '1.1', fontWeight: '480' }],
        heading: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['0.95rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.8rem', { lineHeight: '1.4', fontWeight: '500' }],
        'mono-data': ['0.8rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        btn: '12px',
        card: '16px',
        pill: '999px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      boxShadow: {
        nav: '0 8px 28px rgba(20, 26, 46, 0.10)',
        press: '0 6px 16px rgba(20, 26, 46, 0.12)',
      },
      transitionDuration: {
        page: '150ms',
      },
    },
  },
  plugins: [],
}
