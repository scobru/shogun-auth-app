/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--color-accent)',
        'text-primary': 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'card-bg': 'var(--color-card-bg)',
        'input-bg': 'var(--color-input-bg)',
        'input-border': 'var(--color-input-border)',
        'button-bg': 'var(--color-button)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 32px rgba(0, 0, 0, 0.32)',
      },
      borderRadius: {
        card: '24px',
        input: '12px',
      },
    },
  },
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#4F6BF6",
          "secondary": "#151515",
          "accent": "#4F6BF6",
          "neutral": "#ffffff",
          "base-100": "#1a1240",
          "base-200": "#0a0821",
          "base-300": "#151515",
          "info": "#3abff8",
          "success": "#44ff88",
          "warning": "#fbbd23",
          "error": "#ff4444",
        },
        light: {
          "primary": "#4F6BF6",
          "secondary": "#e0e7ff",
          "accent": "#4F6BF6",
          "neutral": "#1a1a2e",
          "base-100": "#f0f4ff",
          "base-200": "#e0e7ff",
          "base-300": "#ffffff",
          "info": "#3abff8",
          "success": "#43a047",
          "warning": "#f59e0b",
          "error": "#e53935",
        }
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
  },
} 