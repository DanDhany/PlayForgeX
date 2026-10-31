/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        surface: "#121721",
        card: "#181F2C",
        "card-hover": "#212B3D",
        border: "#252F42",
        primary: {
          DEFAULT: "#FA2D48", // Apple Music signature crimson
          hover: "#E0203B",
          dim: "rgba(250, 45, 72, 0.15)"
        },
        ytmusic: {
          DEFAULT: "#FF0000",
          dim: "rgba(255, 0, 0, 0.15)"
        },
        status: {
          exact: "#10B981",
          cover: "#F59E0B",
          unmatched: "#EF4444"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Noto Sans JP", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"]
      }
    },
  },
  plugins: [],
}
