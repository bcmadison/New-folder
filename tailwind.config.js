/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' based on user preference
  theme: {
    extend: {
      colors: {
        // Custom colors for glassmorphism, dark/light modes
        primary: 'rgba(var(--color-primary), <alpha-value>)',
        secondary: 'rgba(var(--color-secondary), <alpha-value>)',
        accent: 'rgba(var(--color-accent), <alpha-value>)',
        background: 'rgba(var(--color-background), <alpha-value>)',
        surface: 'rgba(var(--color-surface), <alpha-value>)',
        text: 'rgba(var(--color-text), <alpha-value>)',
        'text-muted': 'rgba(var(--color-text-muted), <alpha-value>)',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backdropFilter: {
        'blur': 'blur(5px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // Add other theme extensions as needed
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Add other plugins as needed
  ],
} 