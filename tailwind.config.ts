// // tailwind.config.ts
// import type { Config } from "tailwindcss";

// const config: Config = {
//   content: [
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         // ✅ Unified Tailwind tokens mapped to CSS variables
//         bg: "var(--color-bg)",
//         surface: "var(--color-surface)",
//         foreground: "var(--color-foreground)",
//         muted: "var(--color-muted)",
//         primary: "var(--color-primary)",
//         accent: "var(--color-accent)",
//         success: "var(--color-success)",
//         danger: "var(--color-danger)",
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//       },
//       fontFamily: {
//         sans: ["var(--font-sans)"],
//       },
//     },
//   },
//   plugins: [],
// };

// export default config;





module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",

        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",

        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",

        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",

        border: "var(--border)",

        success: "var(--success)",
        danger: "var(--danger)",
      },

      borderRadius: {
        xl: "var(--radius)",
      },
    },
  },
  plugins: [],
};
