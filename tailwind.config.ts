import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5D2CC9",
          50: "#f5f0ff",
          100: "#ede5ff",
          200: "#dcceff",
          300: "#c3a8ff",
          400: "#a577ff",
          500: "#8a4aff",
          600: "#5D2CC9",
          700: "#5722b5",
          800: "#491d97",
          900: "#3d197c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
