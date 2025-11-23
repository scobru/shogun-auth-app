/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
    './index.html',
  ],
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['dark', 'light'],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
  },
} 