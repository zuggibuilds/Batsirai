/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Sora"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        brand: {
          ink: '#12343B',
          sea: '#2D6A4F',
          sand: '#F2E8CF',
          ember: '#E76F51',
          mist: '#DDE5D9',
        },
      },
    },
  },
  plugins: [],
};
