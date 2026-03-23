import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          2: '#162438',
        },
        brand: {
          blue: '#1D4ED8',
          blue2: '#2563EB',
          blue3: '#3B82F6',
          gold: '#D4AF37',
          goldf: '#F0CC5A',
        },
        surface: '#FFFFFF',
        bg: {
          DEFAULT: '#F0F4FA',
          2: '#E8EEF8',
        },
        border: {
          DEFAULT: '#DDE3EE',
          2: '#C8D0E0',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        md: '14px',
        lg: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,27,42,.06), 0 4px 16px rgba(13,27,42,.08)',
        lg: '0 8px 32px rgba(13,27,42,.12)',
      },
    },
  },
  plugins: [],
}

export default config
