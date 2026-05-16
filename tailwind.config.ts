import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SoleBook Brand Palette
        "burnt-peach": {
          DEFAULT: "#F27344",
          50: "#FEF0EB",
          100: "#FDE1D7",
          200: "#FAC3AF",
          300: "#F7A487",
          400: "#F4865F",
          500: "#F27344",
          600: "#EF5A1C",
          700: "#C74815",
          800: "#953610",
          900: "#63240B",
        },
        "prussian-blue": {
          DEFAULT: "#0F172A",
          50: "#E8EAF0",
          100: "#D1D5E1",
          200: "#A3ABC3",
          300: "#7581A5",
          400: "#475787",
          500: "#1E2D5C",
          600: "#172249",
          700: "#111827",
          800: "#0F172A",
          900: "#080D1A",
        },
        "deep-space": {
          DEFAULT: "#1E293B",
          50: "#EBF0F7",
          100: "#D7E1EF",
          200: "#AFC3DF",
          300: "#87A5CF",
          400: "#5F87BF",
          500: "#3A6097",
          600: "#2E4C79",
          700: "#22395B",
          800: "#1E293B",
          900: "#111827",
        },
        "bright-snow": "#F8FAFC",
        "ink-black": "#111827",

        // Semantic tokens
        background: "#0F172A",
        surface: "#1E293B",
        "surface-elevated": "#243347",

        border: "#2A3F5F",
        "border-subtle": "#1F2D42",
        muted: "#64748B",
        "muted-foreground": "#94A3B8",

        // Status
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",

        primary: {
          DEFAULT: "#F27344",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        accent: {
          DEFAULT: "#F27344",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        popover: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        input: "#2A3F5F",
        ring: "#F27344",
        foreground: "#F8FAFC",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-hover":
          "0 10px 40px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(242,115,68,0.25)",
        "glow-lg": "0 0 40px rgba(242,115,68,0.35)",
        "inner-glow": "inset 0 1px 0 rgba(248,250,252,0.06)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-dark":
          "radial-gradient(ellipse at 20% 50%, rgba(242,115,68,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(30,41,59,0.8) 0%, transparent 60%)",
        "bucket-gradient":
          "linear-gradient(135deg, rgba(242,115,68,0.15) 0%, rgba(30,41,59,0.8) 100%)",
        "card-shine":
          "linear-gradient(135deg, rgba(248,250,252,0.05) 0%, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 2s infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(242,115,68,0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(242,115,68,0.5)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
