/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trad: '#2563eb',
        roth: '#7c3aed',
        brok: '#0891b2',
        hsa: '#db2777',
        crypto: '#f59e0b',
      },
    },
  },
  plugins: [],
}
