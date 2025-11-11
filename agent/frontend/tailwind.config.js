/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-bg': '#0f172a',
        'chat-surface': '#1e293b',
        'chat-user': '#3b82f6',
        'chat-agent': '#8b5cf6',
      },
    },
  },
  plugins: [],
}

