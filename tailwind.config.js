const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // or 'class'
  theme: {
    extend: {
      colors: {
        emerald: colors.emerald,
        teal: colors.teal,
        rose: colors.rose,
        // VFO Brand Colors - Premium flooring palette inspired by Tilebar, Shaw Floors
        vfo: {
          // Core neutrals
          charcoal: '#2B2B2B', // Headings - darker, richer than before
          slate: '#4A4A4A', // Secondary text - unchanged
          sand: '#FAF9F7', // Warm off-white background - warmer than before
          bg: '#FAF9F7', // Alias for sand (background color)

          // Typography greys
          grey: '#5F5F5F', // Body text - darker for better contrast
          bluegrey: '#5A6B7D', // Blue-grey for body text - unchanged
          lightgrey: '#999999', // Muted text - unchanged
          muted: '#999999', // Alias for lightgrey

          // Borders
          border: '#E8E6E3', // Warm grey borders - warmer than before

          // Premium accents
          accent: '#8B7355', // Refined warm brown/gold - less yellow, more sophisticated
          accentLight: '#C5B299', // For hover states and lighter touches

          // Trust/success green (subtle)
          trust: '#4A7C59', // For checkmarks, success states

          // Alert/savings (subtle coral - Stone Tile Depot inspired)
          savings: '#D4795B', // For discount badges
        },
      },
      fontFamily: {
        sans: ['Inter', 'Avenir Next', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'Avenir Next', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.3em', // For small caps labels
        heading: '0.18em',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
