import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        paper: "#F7F7F2",
        mist: "#CBD5E1",
        spark: "#F4E409",
        pulse: "#EE4266",
        ember: "#F69226",
        bloom: "#0BAB77",
        "text-secondary": "#0F172A",
        "surface": "#FFFFFF",
        "surface-dim": "#F1F5F9",
        "border-light": "#E2E8F0",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "sm": "6px",
        "md": "10px",
        "lg": "14px",
        "xl": "20px",
        "2xl": "28px",
      },
      boxShadow: {
        "soft-xs": "0 1px 2px rgba(0,0,0,0.04)",
        "soft-sm": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "soft-md": "0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "soft-lg": "0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)",
        "soft-xl": "0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)",
        "glow-pulse": "0 0 20px rgba(238,66,102,0.15)",
        "glow-ember": "0 0 20px rgba(246,146,38,0.15)",
        "glow-bloom": "0 0 20px rgba(11,171,119,0.15)",
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
        progressFill: {
          "0%": { strokeDashoffset: "94.2" },
          "100%": { strokeDashoffset: "11.3" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
