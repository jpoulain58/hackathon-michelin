import type { Config } from "tailwindcss";

// Couleurs issues de la charte Michelin (digitale).
const config: Config = {
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
      },
      fontFamily: {
        sans: ['"Noto Sans"', "system-ui", "-apple-system", "Arial", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
