/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: '#0e6ba8',
        secondary: '#a23b72',
        accent: '#f18f01',
        surface: '#ffffff',
        'surface-soft': '#eef2f7',
        muted: '#6b7280',
        danger: '#b42318',
        success: '#1f8f4b',
        border: '#dbe3ed',
        'dark-navy': '#0f172a',
        'dark-navy-light': '#1e293b',
      },
      fontFamily: {
        heading: ['"Manrope"', '"Segoe UI"', 'sans-serif'],
        body: ['"Manrope"', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
      },
      animation: {
        'shimmer': 'shimmer 1.4s infinite',
        'pulse-badge': 'pulse-badge 2s infinite',
        'fade-in': 'fade-in 180ms ease',
        'rise-in': 'rise-in 220ms ease',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-badge': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
