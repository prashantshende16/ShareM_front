/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0e14",
        foreground: "#f3f4f6",
        card: {
          DEFAULT: "#111827",
          foreground: "#f9fafb",
          border: "#1f2937",
        },
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
          glow: "rgba(59, 130, 246, 0.25)",
        },
        bullish: {
          DEFAULT: "#10b981",
          light: "#34d399",
          glow: "rgba(16, 185, 129, 0.2)",
        },
        bearish: {
          DEFAULT: "#ef4444",
          light: "#f87171",
          glow: "rgba(239, 68, 68, 0.2)",
        },
        sideways: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
          glow: "rgba(245, 158, 11, 0.2)",
        },
        border: "#1f2937",
        input: "#1e293b",
        ring: "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
}
