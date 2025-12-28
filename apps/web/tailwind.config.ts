import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        tikun: {
          50: "#f5f7ff",
          100: "#e7edff",
          500: "#4f6ef7",
          700: "#2e4acf"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
