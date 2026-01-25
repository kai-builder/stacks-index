import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Asset colors
        'sbtc': '#F7931A',
        'ststx': '#5546FF',
        'stx': '#5546FF',
        'usdcx': '#2775CA',

        // Brand colors - Professional Fintech
        'brand': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB', // Primary blue
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#1E3A5F',
          950: '#0A1628', // Deep navy
        },

        // Surface colors for light/dark themes
        'surface': {
          // Light mode
          'light': '#FFFFFF',
          'light-elevated': '#F8FAFC',
          'light-hover': '#F1F5F9',
          // Dark mode
          'dark': '#0A0F1C',
          'dark-elevated': '#111827',
          'dark-hover': '#1F2937',
        },
      },
      fontFamily: {
        heading: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(37, 99, 235, 0.3)',
        'glow-lg': '0 0 60px -15px rgba(37, 99, 235, 0.4)',
      },
    },
  },
  plugins: [],
}
export default config
