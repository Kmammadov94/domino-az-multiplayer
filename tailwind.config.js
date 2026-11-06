/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        table: {
          dark: '#0c2214',
          felt: '#154726',
          border: '#2a1a0c',
          wood: '#3a2012'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
