/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090E", // Deep Obsidian
        surface: "#0D1017",
        "surface-elevated": "#121620",
        card: "#161B27",
        "card-hover": "#1D2333",
        "card-active": "#242C3F",
        border: "rgba(255, 255, 255, 0.08)",
        "border-subtle": "rgba(255, 255, 255, 0.04)",
        primary: {
          DEFAULT: "#FA2D48", // Apple Music Crimson
          hover: "#FF375F",
          dim: "rgba(250, 45, 72, 0.12)",
          ring: "rgba(250, 45, 72, 0.35)",
        },
        ytmusic: {
          DEFAULT: "#FF0000",
          dim: "rgba(255, 0, 0, 0.12)",
        },
        status: {
          exact: "#10B981",
          cover: "#F59E0B",
          unmatched: "#EF4444",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Noto Sans JP",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "Menlo",
          "monospace",
        ],
      },
      transitionTimingFunction: {
        "apple-ease": "cubic-bezier(0.23, 1, 0.32, 1)",
        "drawer-ease": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
}
