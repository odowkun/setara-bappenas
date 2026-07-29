import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        emerald: {
          950: "#022c22",
          900: "#064e3b",
          800: "#065f46",
          700: "#047857",
          600: "#059669",
          500: "#10b981",
          400: "#34d399",
          300: "#6ee7b7",
          100: "#d1fae5",
          50: "#ecfdf5",
        },
        navy: {
          950: "#090d16",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
        },
        gold: {
          500: "#f59e0b",
          400: "#fbbf24",
        },
        cyan: {
          500: "#06b6d4",
          400: "#22d3ee",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        dyslexic: ["Lexend", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
