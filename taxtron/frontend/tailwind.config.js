/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3faf0',
          100: '#e4f4da',
          200: '#c8e9b3',
          300: '#a8dc89',
          400: '#8fce66',
          500: '#8CC152', // primary
          600: '#6ea33d',
          700: '#527c2f',
          800: '#415f27',
          900: '#344c20',
          DEFAULT: '#8CC152',
        },
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0,0,0,0.06)',
        softLg: '0 10px 30px rgba(0,0,0,0.08)'
      },
    },
  },
  plugins: [],
}