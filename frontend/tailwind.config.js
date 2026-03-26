/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          bg: 'var(--stone-bg)',
          surface: 'var(--stone-surface)',
          alt: 'var(--stone-alt)',
          border: 'var(--stone-border)',
          text: 'var(--stone-text)',
          secondary: 'var(--stone-secondary)',
          muted: 'var(--stone-muted)',
        },
        ember: {
          DEFAULT: 'var(--ember)',
          dark: 'var(--ember-dark)',
          soft: 'var(--ember-soft)',
        },
        lichen: {
          DEFAULT: 'var(--lichen)',
          soft: 'var(--lichen-soft)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
}
