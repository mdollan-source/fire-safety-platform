import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional, utilitarian color scheme (no gradients!)
        // Based on safety/compliance industry standards
        brand: {
          50: "#f5f5f5",
          100: "#e5e5e5",
          200: "#d4d4d4",
          300: "#a3a3a3",
          400: "#737373",
          500: "#525252",
          600: "#404040",
          700: "#262626",
          800: "#171717",
          900: "#0a0a0a",
        },
        status: {
          pass: "#16a34a",      // Green - clear pass
          fail: "#dc2626",       // Red - immediate attention
          warning: "#ea580c",    // Orange - needs review
          pending: "#2563eb",    // Blue - in progress
          overdue: "#991b1b",    // Dark red - critical
        },
        severity: {
          critical: "#7f1d1d",
          high: "#dc2626",
          medium: "#ea580c",
          low: "#facc15",
        }
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
