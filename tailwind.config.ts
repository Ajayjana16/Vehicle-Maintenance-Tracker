import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        graphite: {
          950: "#090b0d",
          900: "#0f1215",
          850: "#13171b",
          800: "#181d22",
          750: "#1e242a",
          700: "#272f36",
          600: "#3b454f",
          500: "#5a6774",
          400: "#7e8b97",
          300: "#a9b4bd",
          200: "#d3dbe1",
          100: "#eef2f5",
        },
        pulse: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#e5a93c", // signature automotive amber
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        telemetry: {
          green: "#22c55e",
          amber: "#f59e0b",
          red: "#ef4444",
          cyan: "#38bdf8",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
