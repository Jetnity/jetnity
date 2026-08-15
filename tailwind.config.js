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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',     // edlere Cards
        '2xl': 'calc(var(--radius) + 10px)', // Hero/Surfaces
      },
      boxShadow: {
        e1: '0 1px 2px hsl(0 0% 0% / 0.05), 0 1px 8px hsl(0 0% 0% / 0.04)',
        e2: '0 4px 16px hsl(222 60% 20% / 0.08)',
        e3: '0 10px 30px hsl(222 60% 20% / 0.12)',
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

        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), // für .prose (Blog/Markdown)
    require("tailwind-scrollbar-hide"),
    require("tailwindcss-animate"),
  ],
}
