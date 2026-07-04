import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0B0A12",
        deep: "#131120",
        ink: "#F4F2FB",
        muted: "#9B96B3",
        faint: "#6B6684",
        line: "rgba(244,242,251,0.09)",
        "line-strong": "rgba(244,242,251,0.16)",
        violet: {
          DEFAULT: "#8C7CFF",
          50: "#F2F0FF",
          100: "#E3DEFF",
          200: "#C7BEFF",
          300: "#AB9EFF",
          400: "#8C7CFF",
          500: "#6E5BF0",
          600: "#5843D6",
          700: "#4432A8",
        },
        amber: {
          DEFAULT: "#FFB870",
          50: "#FFF4E7",
          200: "#FFD9A8",
          400: "#FFB870",
          500: "#F5993E",
          600: "#D97B1F",
        },
        surface: "rgba(244,242,251,0.045)",
        "surface-hover": "rgba(244,242,251,0.075)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      backgroundImage: {
        "aurora-1": "radial-gradient(60% 60% at 20% 20%, rgba(140,124,255,0.35), transparent 70%)",
        "aurora-2": "radial-gradient(50% 50% at 80% 10%, rgba(255,184,112,0.22), transparent 70%)",
        "aurora-3": "radial-gradient(60% 60% at 50% 100%, rgba(140,124,255,0.18), transparent 70%)",
        "grain": "url('/noise.svg')",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-2%, 3%) scale(1.05)" },
        },
        "pulse-node": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        "dash": {
          to: { strokeDashoffset: "0" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "drift 26s ease-in-out infinite",
        "pulse-node": "pulse-node 3.4s ease-in-out infinite",
        dash: "dash 2.4s linear forwards",
        rise: "rise 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
