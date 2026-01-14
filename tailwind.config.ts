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
        /* Market Overview palette (keys used by the table styles) */
        cardHover: "var(--cardHover)",
        header: "var(--header)",
        mutedForeground: "var(--muted-foreground)",
        primaryForeground: "var(--primary-foreground)",

        bg: "var(--bg)",
        surface: "var(--surface)",

        background: "var(--background)",
        foreground: "var(--foreground)",

        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",

        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",

        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",

        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",

        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",

        "card-header": "var(--card-header)",

        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",

        sidebar: "var(--sidebar)",
        "sidebar-foreground": "var(--sidebar-foreground)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-accent": "var(--sidebar-accent)",
        "sidebar-primary": "var(--sidebar-primary)",

        border: "var(--border)",

        input: "var(--input)",
        ring: "var(--ring)",

        success: "var(--success)",
        danger: "var(--danger)",

        warning: "var(--warning)",

        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
      },

      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },

      borderRadius: {
        xl: "var(--radius)",
      },
    },
  },
  plugins: [],
};
