import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    'hsl(var(--bg-base) / <alpha-value>)',
          surface: 'hsl(var(--bg-surface) / <alpha-value>)',
          subtle:  'hsl(var(--bg-subtle) / <alpha-value>)'
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        text: {
          primary: 'hsl(var(--text-primary) / <alpha-value>)',
          muted:   'hsl(var(--text-muted) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          green:   'hsl(var(--accent-green) / <alpha-value>)',
          amber:   'hsl(var(--accent-amber) / <alpha-value>)',
          red:     'hsl(var(--accent-red) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace']
      },
      fontSize: {
        xs:  ['0.75rem',  { lineHeight: '1rem' }],
        sm:  ['0.875rem', { lineHeight: '1.25rem' }],
        base:['1rem',     { lineHeight: '1.5rem' }],
        lg:  ['1.25rem',  { lineHeight: '1.75rem' }],
        xl:  ['1.5rem',   { lineHeight: '2rem' }],
        '2xl':['2rem',    { lineHeight: '2.5rem' }]
      },
      transitionTimingFunction: {
        snap: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

export default config;
