import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f4c4cc',
          300: '#e89aa9',
          400: '#d96a80',
          500: '#c64060',
          600: '#a82848',
          700: '#8a1e38',
          800: '#6B1E2E',
          900: '#4e1622',
          950: '#2d0c13',
          DEFAULT: '#6B1E2E',
        },
        gold: {
          50: '#fdfbe8',
          100: '#faf4c4',
          200: '#f5e98c',
          300: '#eed84a',
          400: '#e5c620',
          500: '#d4af12',
          600: '#B8960C',
          700: '#8f7009',
          800: '#745a0c',
          900: '#614c10',
          950: '#372a04',
          DEFAULT: '#B8960C',
        },
        cream: '#FAF7F2',
        'near-black': '#1C1C1E',
      },
      fontFamily: {
        cormorant: ['var(--font-cormorant)', 'Georgia', 'serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
