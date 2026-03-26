/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0e6ba8',
        secondary: '#a23b72',
        accent: '#f18f01',
      },
    },
  },
  plugins: [],
}
