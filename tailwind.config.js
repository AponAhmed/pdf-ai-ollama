/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './frontend/**/*.html', // Include all HTML files
    './frontend/src/**/*.{js,jsx}', // Include JS files in src
    './frontend/src/styles.css', // Include your styles.css file
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
