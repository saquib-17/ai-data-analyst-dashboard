/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#4f46e5',
        secondary: '#6366f1',
        dark: '#1e293b',
        darker: '#0f172a',
      }
    },
  },
  plugins: [],
}
