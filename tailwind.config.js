/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui Required Colors
        "border": "var(--border)",
        "input": "var(--input)",
        "ring": "var(--ring)",
        "background": "var(--background)",
        "foreground": "var(--foreground)",
        "primary": {
          "DEFAULT": "#fa520f",
          "foreground": "#ffffff"
        },
        "secondary": {
          "DEFAULT": "#fff0c2",
          "foreground": "#1f1f1f"
        },
        "destructive": {
          "DEFAULT": "#dc2626",
          "foreground": "#ffffff"
        },
        "muted": {
          "DEFAULT": "#1f1f1f",
          "foreground": "#1f1f1f"
        },
        "accent": {
          "DEFAULT": "#fa520f",
          "foreground": "#ffffff"
        },
        "popover": {
          "DEFAULT": "#ffffff",
          "foreground": "#1f1f1f"
        },
        "card": {
          "DEFAULT": "#fff0c2",
          "foreground": "#1f1f1f"
        },

        // Primary Brand Colors (Mistral)
        "mistral-orange": "#fa520f",
        "mistral-flame": "#fb6424",
        "block-orange": "#ff8105",
        
        // Secondary & Accent (Sunshine Gold)
        "sunshine-900": "#ff8a00",
        "sunshine-700": "#ffa110",
        "sunshine-500": "#ffb83e",
        "sunshine-300": "#ffd06a",
        "block-gold": "#ffe295",
        "bright-yellow": "#ffd900",
        
        // Surface & Background
        "warm-ivory": "#fffaeb",
        "mistral-cream": "#fff0c2",
        "mistral-black": "#1f1f1f",
        
        // Semantic Colors
        "accent-orange": "hsl(17, 96%, 52%)",
      },
      fontSize: {
        // Display Typography (following DESIGN.md)
        "display-lg": ["82px", { lineHeight: "1", letterSpacing: "-2.05px" }],
        "display": ["56px", { lineHeight: "1.2", letterSpacing: "-1.4px" }],
        "heading-lg": ["48px", { lineHeight: "1.2", letterSpacing: "-1.2px" }],
        "heading": ["32px", { lineHeight: "1.3", letterSpacing: "-0.8px" }],
        "subheading": ["24px", { lineHeight: "1.4" }],
        "body-lg": ["18px", { lineHeight: "1.6" }],
        "body": ["16px", { lineHeight: "1.6" }],
        "caption": ["14px", { lineHeight: "1.5" }],
      },
      fontFamily: {
        "sans": ["Arial", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        "none": "0px",
        "xs": "2px",
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
      },
      boxShadow: {
        "warm": "0 4px 12px rgba(127, 99, 21, 0.1)",
        "warm-md": "0 8px 24px rgba(127, 99, 21, 0.15)",
        "warm-lg": "0 12px 36px rgba(127, 99, 21, 0.2)",
      },
    },
  },
  plugins: [],
};