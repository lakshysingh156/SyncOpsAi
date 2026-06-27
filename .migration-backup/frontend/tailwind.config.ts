import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SyncOps dark palette
        canvas: "#0B0D10",
        surface: "#14171C",
        "surface-2": "#1A1E25",
        border: "#242A33",
        muted: "#8B95A5",
        foreground: "#E6EAF0",
        accent: {
          DEFAULT: "#6D5EF8",
          hover: "#8275FA",
        },
        ok: "#34D399",
        warn: "#FBBF24",
        danger: "#F87171",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
