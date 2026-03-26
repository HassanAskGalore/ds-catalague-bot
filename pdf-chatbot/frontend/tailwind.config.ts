import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'moss-blue': '#005b9f',
        'moss-red': '#e3000f',
        'moss-light': '#f9fafb',
        'moss-gray': '#e5e7eb',
        'moss-dark': '#1f2937',
        'navy': {
          900: '#ffffff',
          800: '#f8f9fa',
          700: '#eef2f6',
          600: '#e2e8f0',
        },
        'cyan': {
          100: '#dcebf5',
          400: '#005b9f',
          500: '#004c8c',
          600: '#003e73',
        }
      }
    },
  },
  plugins: [],
}
export default config
