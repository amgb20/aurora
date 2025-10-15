/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        speaker1: {
          DEFAULT: '#3b82f6',
          light: '#93c5fd',
          dark: '#1e40af',
        },
        speaker2: {
          DEFAULT: '#10b981',
          light: '#6ee7b7',
          dark: '#047857',
        },
        compatibility: {
          DEFAULT: '#8b5cf6',
          light: '#c4b5fd',
          dark: '#6d28d9',
        },
      },
    },
  },
  plugins: [],
}

