import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans:    ["var(--font-manrope)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-sora)", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px" }],
        xs:    ["12px", { lineHeight: "16px" }],
        sm:    ["13px", { lineHeight: "20px" }],
        base:  ["14px", { lineHeight: "20px" }],
        lg:    ["15px", { lineHeight: "22px" }],
        xl:    ["16px", { lineHeight: "24px" }],
        "2xl": ["20px", { lineHeight: "28px" }],
        "3xl": ["24px", { lineHeight: "32px" }],
      },
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        emerald: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        solar: {
          gold:  "hsl(43 96% 56%)",
          light: "hsl(43 100% 90%)",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
        xl: "16px",
      },
      boxShadow: {
        card:       "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)",
        glass:      "0 4px 24px -2px rgba(0,0,0,0.05), 0 2px 8px -1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
        "lift":     "0 12px 32px rgba(0,0,0,0.09), 0 4px 12px rgba(0,0,0,0.06)",
        emerald:    "0 4px 14px rgba(16,185,129,0.25)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
