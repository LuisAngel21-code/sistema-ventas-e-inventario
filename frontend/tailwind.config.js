/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e3a5f',
          800: '#1e2d4a',
          900: '#0f1a2e',
        },
        wood: {
          50: '#fdf8f0',
          100: '#f5e6c6',
          200: '#ebd09c',
          300: '#dbb56a',
          400: '#c1904a',
          500: '#a87b3e',
          600: '#8c6334',
          700: '#6f4e2a',
          800: '#5a4023',
          900: '#3d2c1a',
        },
      },
    },
  },
  plugins: [],
};
