/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        primary: "var(--cyan-500)",
        "cyber-navy": "#0B0F1A",
        "neon-emerald": "#10B981",
        "pulsing-indigo": "#6366F1",
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
