import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wood:  { DEFAULT: '#4CAF50', light: '#E8F5E9', dark: '#2E7D32' },
        fire:  { DEFAULT: '#F44336', light: '#FFEBEE', dark: '#C62828' },
        earth: { DEFAULT: '#FF9800', light: '#FFF3E0', dark: '#E65100' },
        metal: { DEFAULT: '#9E9E9E', light: '#F5F5F5', dark: '#424242' },
        water: { DEFAULT: '#2196F3', light: '#E3F2FD', dark: '#0D47A1' },
      },
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
