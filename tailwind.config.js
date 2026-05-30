/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pion: {
          'deep-blue': '#005A8F',
          'cyan': '#00AFEF',
          'navy': '#284358',
          'light': '#FFFBFC',
          'dark': '#333333',
          'gray': '#E8E8E8',
        }
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'bebas': ['Bebas Neue', 'cursive'],
      },
    },
  },
  plugins: [],
};
