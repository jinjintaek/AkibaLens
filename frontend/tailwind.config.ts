import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        ocean: "#1f6f8b",
        mist: "#eef8fb",
      },
    },
  },
  plugins: [],
};

export default config;

