import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base dark palette
        dark: {
          50: "#e8e8ef",
          100: "#c5c5d4",
          200: "#9e9eb8",
          300: "#77779c",
          400: "#5a5a87",
          500: "#3d3d72",
          600: "#2e2e5e",
          700: "#1e1e3f",
          800: "#12122a",
          900: "#0a0a1a",
          950: "#05050d",
        },
        // Neon cyan accent
        neon: {
          50: "#e0fbff",
          100: "#b3f4ff",
          200: "#7aedff",
          300: "#3de5ff",
          400: "#00d4ff",
          500: "#00bde8",
          600: "#0099be",
          700: "#007494",
          800: "#004f6a",
          900: "#002b40",
        },
        // Purple accent
        violet: {
          50: "#f3e8ff",
          100: "#e9d5ff",
          200: "#d8b4fe",
          300: "#c084fc",
          400: "#a855f7",
          500: "#9333ea",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern": `
          radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.08) 0%, transparent 60%)
        `,
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "neon-cyan":
          "0 0 20px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.15)",
        "neon-violet":
          "0 0 20px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.15)",
        glass:
          "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        card: "0 2px 16px rgba(0,0,0,0.3)",
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
