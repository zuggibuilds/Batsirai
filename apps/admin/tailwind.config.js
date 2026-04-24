/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          navy: '#0B132B',
          cyan: '#5BC0BE',
          slate: '#3A506B',
          cloud: '#E0FBFC',
          coral: '#EE6C4D'
        }
      },
      fontFamily: {
        heading: ['"Sora"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif']
      }
    },
  },
  plugins: [],
};
