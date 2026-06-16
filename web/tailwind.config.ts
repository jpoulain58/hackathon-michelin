import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Couleurs issues de la charte Michelin (digitale) + tokens shadcn/ui
// (mappes sur des variables CSS HSL definies dans app/globals.css).
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        michelin: {
          blue: "#27509B",
          navy: "#000C34",
          yellow: "#FCE500",
          green: "#2E7D32",
          ink: "#53565A",
          "gray-light": "#F2F2F2",
          "gray-line": "#E5E5E5",
        },
        // Tokens shadcn/ui (themes sur la charte Michelin via globals.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', "system-ui", "-apple-system", "Arial", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
        "3xl": "1.75rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Courbes d'easing (Emil Kowalski) : les easings CSS natifs manquent de
      // punch. ease-out fort pour les entrees/interactions UI.
      transitionTimingFunction: {
        "out-strong": "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out-strong": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,12,52,0.04), 0 8px 24px -12px rgba(0,12,52,0.12)",
        lift: "0 18px 40px -16px rgba(0,12,52,0.28)",
        glow: "0 0 0 1px rgba(39,80,155,0.12), 0 24px 60px -24px rgba(39,80,155,0.45)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.23, 1, 0.32, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.23, 1, 0.32, 1) both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
