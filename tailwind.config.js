/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "archivo cultural cálido"
        paper: '#F4EDE1', // fondo base - papel viejo
        cream: '#FBF7F0', // superficies / tarjetas
        ink: '#2B211A', // tinta principal (marrón casi negro)
        terracota: {
          DEFAULT: '#B5502E', // primario
          soft: '#C96B45',
          dark: '#8F3C20',
        },
        selva: {
          DEFAULT: '#2F4A3C', // verde selva
          soft: '#3E5F4E',
          dark: '#22382C',
        },
        ocre: {
          DEFAULT: '#D08C2E', // acento tierra / mostaza
          soft: '#E0A94F',
        },
        anil: {
          DEFAULT: '#3A4A7A', // acento vibrante (tinte textil)
          soft: '#54659A',
        },
        arena: '#DDCBB2', // bordes / líneas
        arenaDark: '#C7B091',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        warm: '0 12px 40px -12px rgba(43, 33, 26, 0.25)',
        soft: '0 4px 20px -8px rgba(43, 33, 26, 0.18)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s ease-out both',
        floaty: 'floaty 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
