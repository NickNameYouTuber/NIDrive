/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
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
      },
    },
  },
  plugins: [],
}
