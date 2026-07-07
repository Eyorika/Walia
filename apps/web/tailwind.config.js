/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0D1117',
          card: '#161B22',
          border: '#30363D',
          primary: '#00C851', // Neon green
          accent: '#FFB800',  // Ethiopian gold
          text: '#C9D1D9',
          muted: '#8B949E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
