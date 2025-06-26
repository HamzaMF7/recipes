import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // colors: {
      //   background: "var(--background)",
      //   dark: "var(--dark)",
      //   primary1: "var(--primary1)", // Remove the nested object
      //   primary2: "var(--primary2)",
      //   primary3: "var(--primary3)",
      //   primary4: "var(--primary4)",
      //   light: "var(--light)",
      // },
    },
  },
  plugins: [],
};
export default config;
