/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: '#e6ffff',
          100: '#ccffff',
          200: '#99ffff',
          300: '#66ffff',
          400: '#33ffff',
          500: '#00ffff',
          600: '#00C9C9',
          700: '#009999',
          800: '#006666',
          900: '#003333',
          950: '#001919',
        },
        dark: {
          bg: '#121212',
          card: '#1E1E1E',
          border: '#2D2D2D',
          text: '#E0E0E0',
          primary: '#00C9C9',
          secondary: '#595959'
        }
      },
    },
  },
  plugins: [],
}
