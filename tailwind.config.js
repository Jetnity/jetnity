const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./content/**/*.{md,mdx}",        // optional: MD/MDX Inhalte
  ],
  theme: {
    extend: {
      screens: {
        // Flache Viewports: Telefone im Querformat und Fenster, in denen die
        // Browserleisten viel Hoehe kosten. Grosse Mindesthoehen aus dem
        // Hochformat wuerden dort ueber den Bildschirm hinausreichen.
        // Bewusst nach den Breiten-Breakpoints ergaenzt, damit `short:` eine
        // vorher gesetzte `sm:`-Hoehe uebersteuern kann.
        short: { raw: '(max-height: 560px)' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',     // edlere Cards
        '2xl': 'calc(var(--radius) + 10px)', // Hero/Surfaces
      },
      boxShadow: {
        e1: '0 1px 2px rgb(0 0 0 / 0.05), 0 1px 8px rgb(0 0 0 / 0.04)',
      },
      colors: {
        // Jetnity V2 – Markenpalette. Werte in styles/globals.css.
        brand: {
          600: 'rgb(var(--jet-brand-600) / <alpha-value>)',
          700: 'rgb(var(--jet-brand-700) / <alpha-value>)',
          800: 'rgb(var(--jet-brand-800) / <alpha-value>)',
          900: 'rgb(var(--jet-brand-900) / <alpha-value>)',
        },
        citrus: {
          300: 'rgb(var(--jet-citrus-300) / <alpha-value>)',
          400: 'rgb(var(--jet-citrus-400) / <alpha-value>)',
          500: 'rgb(var(--jet-citrus-500) / <alpha-value>)',
        },
        surface: {
          0: 'rgb(var(--jet-surface-0) / <alpha-value>)',
          25: 'rgb(var(--jet-surface-25) / <alpha-value>)',
          50: 'rgb(var(--jet-surface-50) / <alpha-value>)',
          75: 'rgb(var(--jet-surface-75) / <alpha-value>)',
          100: 'rgb(var(--jet-surface-100) / <alpha-value>)',
          200: 'rgb(var(--jet-surface-200) / <alpha-value>)',
        },
        line: {
          100: 'rgb(var(--jet-line-100) / <alpha-value>)',
          200: 'rgb(var(--jet-line-200) / <alpha-value>)',
          300: 'rgb(var(--jet-line-300) / <alpha-value>)',
          400: 'rgb(var(--jet-line-400) / <alpha-value>)',
          500: 'rgb(var(--jet-line-500) / <alpha-value>)',
        },
        ink: {
          300: 'rgb(var(--jet-ink-300) / <alpha-value>)',
          400: 'rgb(var(--jet-ink-400) / <alpha-value>)',
          500: 'rgb(var(--jet-ink-500) / <alpha-value>)',
          600: 'rgb(var(--jet-ink-600) / <alpha-value>)',
          650: 'rgb(var(--jet-ink-650) / <alpha-value>)',
          700: 'rgb(var(--jet-ink-700) / <alpha-value>)',
          800: 'rgb(var(--jet-ink-800) / <alpha-value>)',
          900: 'rgb(var(--jet-ink-900) / <alpha-value>)',
          950: 'rgb(var(--jet-ink-950) / <alpha-value>)',
        },

        // Semantische shadcn-Namen. Sie verweisen in styles/globals.css auf die
        // Markenpalette darueber, deshalb dieselbe RGB-Notation.
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar-hide"),
    require("tailwindcss-animate"),
    // Zeigegerät statt Breakpoint: Telefone und Tablets bleiben auch im
    // Querformat Touch-Geräte. Nur Geräte mit Maus erhalten die kompaktere
    // Variante (Schriftgröße in Feldern, kleinere Trefferflächen).
    plugin(({ addVariant }) => {
      addVariant("pointer-fine", "@media (hover: hover) and (pointer: fine)")
      addVariant("pointer-coarse", "@media (pointer: coarse)")
    }),
  ],
}
