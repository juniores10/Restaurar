/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pion: {
          'deep-blue': '#0f172a',
          'cyan': '#0ea5e9',
          'navy': '#1e293b',
          'light': '#f8fafc',
          'dark': '#0f172a',
          'gray': '#e2e8f0',
        },
        slate: {
          850: '#172033',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'montserrat': ['Inter', 'sans-serif'],
        'bebas': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 10px -3px rgba(0, 0, 0, 0.04)',
        'sidebar': '4px 0 20px -4px rgba(0, 0, 0, 0.15)',
        'navbar': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
