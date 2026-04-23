/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0d0d14", 1: "#0f0f18", 2: "#13131d", 3: "#191922", 4: "#1f1f2a", 5: "#272733", 6: "#30303e", 7: "#3c3c4c" },
        accent: { DEFAULT: "#e67e22", light: "#f0923a", dark: "#c96a15", glow: "rgba(230,126,34,0.15)" },
        neon: { green: "#2ecc71", red: "#e74c3c", blue: "#4a9eff", purple: "#a855f7", cyan: "#22d3ee", pink: "#f472b6" },
        txt: { 1: "#f0ece4", 2: "#8a8694", 3: "#5a5768", g: "#3a3848" },
      },
      fontFamily: { display: ['"DM Sans"', "system-ui", "sans-serif"], mono: ['"JetBrains Mono"', "monospace"] },
      keyframes: {
        cursorBlink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.4)", filter: "blur(8px)" }, to: { opacity: "1", transform: "scale(1)", filter: "blur(0)" } },
        pulseRing: { from: { width: "80px", height: "80px", opacity: "0.5" }, to: { width: "450px", height: "450px", opacity: "0" } },
        shimmer: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(100%)" } },
      },
      animation: {
        "cursor-blink": "cursorBlink 0.9s step-end infinite",
        "fade-up": "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-ring": "pulseRing 1.2s ease-out both",
        shimmer: "shimmer 0.7s ease both",
      },
    },
  },
  plugins: [],
};
