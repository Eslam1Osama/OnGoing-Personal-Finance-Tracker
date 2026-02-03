/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
        },
      },
    },
  },
  plugins: [
    // Custom plugin for hover-only-on-capable-devices
    plugin(function({ addVariant }) {
      // `can-hover:` - Only applies styles on devices that support hover (mouse/trackpad)
      // Usage: can-hover:bg-blue-500 (will only apply on desktop, not touch)
      addVariant('can-hover', '@media (hover: hover) and (pointer: fine)');
      
      // `touch:` - Only applies styles on touch devices
      // Usage: touch:scale-95 (will only apply on touch devices when active)
      addVariant('touch', '@media (hover: none) or (pointer: coarse)');
      
      // `touch-active:` - Active state on touch devices
      addVariant('touch-active', '@media (hover: none) { &:active }');
    }),
  ],
}
