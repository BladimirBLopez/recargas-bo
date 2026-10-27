/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './data/**/*.js'],
  theme: {
    extend: {
      colors: { yellow: { 300: 'rgb(var(--accent) / <alpha-value>)' },
      orange: { 300: 'rgb(var(--accent-lt) / <alpha-value>)', 400: 'rgb(var(--accent2) / <alpha-value>)', 500: 'rgb(var(--accent2) / <alpha-value>)' } },
      fontFamily: { display: ['var(--font-display)', 'sans-serif'] },
    },
  },
  plugins: [],
};
