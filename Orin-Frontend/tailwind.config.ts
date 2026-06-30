import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        mist: "var(--color-mist)",
        spark: "var(--color-spark)",
        pulse: "var(--color-pulse)",
        ember: "var(--color-ember)",
        bloom: "var(--color-bloom)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        surface: "var(--color-surface)",
        "surface-dim": "var(--color-surface-dim)",
        "surface-hover": "var(--color-surface-hover)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        danger: "var(--color-danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        "glow-pulse": "var(--shadow-glow-pulse)",
        "glow-ember": "var(--shadow-glow-ember)",
        "glow-bloom": "var(--shadow-glow-bloom)",
        "glow-spark": "var(--shadow-glow-spark)",
        "colored-pulse": "var(--shadow-colored-pulse)",
        "colored-ember": "var(--shadow-colored-ember)",
        "colored-bloom": "var(--shadow-colored-bloom)",
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "float-slower": "floatSlower 7.5s ease-in-out infinite",
        "pulse-dot": "pulseDot 1.8s ease-in-out infinite",
        "slide-in": "slideInLeft 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        "shine": "shineMove 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        floatSlower: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.4)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shineMove: {
          "0%": { left: "-100%" },
          "70%, 100%": { left: "200%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
