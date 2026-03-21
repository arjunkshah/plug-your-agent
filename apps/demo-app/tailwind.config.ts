import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/react-widget/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "Satoshi", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // Linear-inspired dark palette
        linear: {
          bg: "#08090a",
          surface: "#0c0e12",
          surfaceElevated: "#13161b",
          border: "rgba(255,255,255,0.08)",
          borderHover: "rgba(255,255,255,0.15)",
          text: "#f7f8f8",
          textMuted: "#8a8f98",
          textDim: "#5c6370",
          accent: "#5e6ad2",
          accentHover: "#6f7cf4",
          // Gradient colors
          teal: "#0fe7b3",
          tealMuted: "#c1fff6",
          blue: "#0f57e7",
          blueMuted: "#c1dcff",
          purple: "#8b5cf6",
          purpleMuted: "#c4b5fd",
        },
      },
      animation: {
        "fade-in": "fadeIn 600ms ease-out both",
        "slide-up": "slideUp 600ms ease-out both",
        "scale-in": "scaleIn 400ms ease-out both",
        "blur-in": "blurIn 800ms ease-out both",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blurIn: {
          "0%": { opacity: "0", filter: "blur(10px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-linear": "linear-gradient(var(--tw-gradient-stops))",
        "grid-pattern": `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        "grid-sm": "24px 24px",
        "grid-md": "48px 48px",
      },
    },
  },
  plugins: [],
} satisfies Config;
