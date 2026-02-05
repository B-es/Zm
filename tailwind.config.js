/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "border-color": "#D9D9D9",
        "brand-default": "#2C2C2C",
      },
    },
  },
  plugins: [],
}