/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          bg: "#F3F1ED",
          surface: "#F7F5F2",
          alt: "#ECE7E1",
          border: "#D8D0C7",
          text: "#2E2A26",
          secondary: "#7A7168",
          muted: "#9A9086",
        },
        ember: {
          DEFAULT: "#AB5329",
          dark: "#8A4220",
          soft: "#EEDCD2",
        },
        lichen: {
          DEFAULT: "#6E8B57",
          soft: "#DCE6D5",
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', "sans-serif"],
      },
    },
  },
  plugins: [],
}
