/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0C0F", // Deep neutral ground
        surface: "#12141A",    // Primary sidebars, panels
        "surface-elevated": "#1A1D25", // Dialogs, sheets, menus
        "surface-hover": "#222630",    // Hover interactive state
        border: "#292D37",     // Hairline borders
        "border-subtle": "rgba(255, 255, 255, 0.05)",
        text: {
          primary: "#F5F5F7",
          secondary: "#A3A8B5",
          muted: "#6B7280",
        },
        accent: {
          DEFAULT: "#A99BFF",  // Signature PlayForgeX Periwinkle
          hover: "#BDB2FF",
          dim: "rgba(169, 155, 255, 0.12)",
          ring: "rgba(169, 155, 255, 0.35)",
        },
        primary: {
          DEFAULT: "#A99BFF",
          hover: "#BDB2FF",
          dim: "rgba(169, 155, 255, 0.12)",
        },
        service: {
          ytmusic: "#FF0000",
          apple: "#FA2D48",
        },
        status: {
          success: "#69D6AF",
          exact: "#69D6AF",
          warning: "#F2BE72",
          cover: "#F2BE72",
          danger: "#FF777F",
          unmatched: "#FF777F",
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
