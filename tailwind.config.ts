import type { Config } from "tailwindcss";

/**
 * Tokens issus du design « Swoo » (thème vert), adaptés à Celebobo.
 * Police : Hanken Grotesk (variable --font-hanken). Icônes : Iconsax.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "15px",
      screens: { DEFAULT: "1330px" },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1ABA1A",
          light: "#1BF11B",
          dark: "#139713",
          50: "rgba(26,186,26,0.05)",
          100: "rgba(26,186,26,0.1)",
        },
        danger: { DEFAULT: "#F1352B", 50: "rgba(241,53,43,0.05)", 100: "rgba(241,53,43,0.1)" },
        star: "#FFA500",
        sun: { DEFAULT: "#FFE400", 2: "#FFC107" },
        page: "#E2E4EB",
        chip: { DEFAULT: "#EBEEF6", 2: "#EBEDF3", 3: "#EDEFF6", social: "#E1E3EB" },
        ink: { DEFAULT: "#000000", 2: "#666666", 3: "#999999", 4: "#757575", dark: "#222222", dark2: "#333333" },
        line: { DEFAULT: "#CCCCCC", 2: "#999999", 3: "#DEE2E6" },
        info: "#0D6EFD",
      },
      fontFamily: {
        sans: ["var(--font-hanken)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // taille / line-height du design
        "section": ["18px", { lineHeight: "21.6px", fontWeight: "700" }],
        "tab": ["18px", { lineHeight: "27px" }],
        "link": ["13px", { lineHeight: "19.5px" }],
        "name": ["14px", { lineHeight: "16.8px", fontWeight: "700" }],
        "price": ["18px", { lineHeight: "21.6px", fontWeight: "600" }],
        "body": ["14px", { lineHeight: "21px" }],
        "body-lg": ["14px", { lineHeight: "25.2px" }],
        "small": ["12px", { lineHeight: "18px" }],
        "tiny": ["10px", { lineHeight: "15px" }],
        "h-hero": ["30px", { lineHeight: "36px" }],
        "h-page": ["28px", { lineHeight: "33.6px", fontWeight: "700" }],
      },
      spacing: {
        /** Hauteur de la barre d'onglets mobile (0 sur desktop) — voir globals.css */
        tabbar: "var(--tabbar-h)",
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-t": "env(safe-area-inset-top)",
      },
      borderRadius: {
        box: "10px",
        pill: "30px",
      },
      borderColor: {
        DEFAULT: "#CCCCCC",
      },
      screens: {
        xs: "480px",
        "3xl": "1400px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "ken-burns": {
          "0%": { transform: "scale(1) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.12) translate3d(-1.5%,-1%,0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(1.5deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "typing-dot": {
          "0%,60%,100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "var(--len, 1000)" },
          "100%": { strokeDashoffset: "0" },
        },
        "bar-grow": {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(320%) skewX(-20deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.22,1,.36,1) both",
        "fade-in": "fade-in .5s ease both",
        "ken-burns": "ken-burns 9s ease-out both",
        float: "float 5s ease-in-out infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        pop: "pop .35s ease",
        "slide-in-right": "slide-in-right .35s cubic-bezier(.22,1,.36,1) both",
        "typing-dot": "typing-dot 1.1s ease-in-out infinite",
        "draw-line": "draw-line 1.4s ease-out forwards",
        "bar-grow": "bar-grow .8s cubic-bezier(.22,1,.36,1) both",
        sheen: "sheen 1.1s ease",
      },
    },
  },
  plugins: [],
};

export default config;
