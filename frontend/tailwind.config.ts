import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#211d2c',
        muted: '#797582',
        paper: '#f8f7f5',
        accent: '#6d55c7',
      },
      boxShadow: {
        card: '0 18px 60px rgba(37, 29, 56, .07)',
      },
    },
  },
  plugins: [],
};

export default config;
