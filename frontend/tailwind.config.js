/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Dark mode disabled — light mode only
  // darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#dbeafe',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
        },
        success: {
          50: '#d1fae5',
          500: '#10b981',
          700: '#065f46',
        },
        warning: {
          50: '#fed7aa',
          500: '#f59e0b',
          700: '#92400e',
        }
      }
    },
  },
  plugins: [],
}
