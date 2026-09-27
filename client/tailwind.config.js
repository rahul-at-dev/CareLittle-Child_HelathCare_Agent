/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Raleway', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        forest: {
          900: '#253D2C', // Darkest Evergreen / Charcoal
          800: '#1E4C2C',
          700: '#2E6F40', // Main Lush Forest Green
          600: '#439557',
          500: '#68BA7F', // Mid Sage Green
          300: '#9AE0B1',
          100: '#CFFFDC', // Soft Mint Light
          50:  '#F4FAF5', // Off-white mint background
        }
      }
    },
  },
  plugins: [],
}
