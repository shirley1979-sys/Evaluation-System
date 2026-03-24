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
        // EverEx 브랜드 민트 (주요 인터랙션 컬러)
        mint: {
          50:  '#edfafa',
          100: '#d4f7f6',
          200: '#aaeeed',
          300: '#7dd8d6',
          400: '#4cc4c2',
          500: '#07beb8',  // 메인 민트
          600: '#04afab',
          700: '#039f9b',
          800: '#027d7a',
          900: '#015c59',
        },
        // EverEx 네이비
        navy: {
          DEFAULT: '#192628',
          sidebar: '#0D1B2A',
          2: '#162438',
        },
        brand: {
          mint:  '#07BEB8',
          mint2: '#04AFAB',
          navy:  '#4156A1',
          gold:  '#D4AF37',
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
