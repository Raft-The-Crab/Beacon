/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beacon: {
          brand: '#5865f2',
          'brand-hover': '#4752c4',
          'surface-0': '#313338',
          'surface-1': '#2b2d31', 
          'surface-2': '#232428',
        }
      }
    },
  },
  plugins: [],
}
