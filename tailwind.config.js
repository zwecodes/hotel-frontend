/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#1a56db",
          700: "#1e429f",
          800: "#1e3a8a",
          900: "#1e3061",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
