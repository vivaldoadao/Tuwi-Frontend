import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ['var(--font-primary)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      heading: ['var(--font-heading)', 'Playfair Display', 'Georgia', 'serif'],
      primary: ['var(--font-primary)', 'Inter', 'sans-serif'],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accentDefault: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Elegant brand color system - Sage Green & Soft Blue theme
        brand: {
          50: '#f8faf9',
          100: '#f0f4f1',
          200: '#e1ebe3',
          300: '#c8d6cc',
          400: '#a8bfad',
          500: '#84a98c', // Primary sage green
          600: '#6b8e73',
          700: '#52796f', // Deeper sage
          800: '#354f52', // Dark sage
          900: '#2f3e46',
          950: '#1a2328',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Soft blue accent
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Warm support colors
        secondary: {
          50: '#fefbf3',
          100: '#fef7e7',
          200: '#fdecc4',
          300: '#fbdc96',
          400: '#f7c565',
          500: '#f4b942', // Warm gold
          600: '#e8a317',
          700: '#c18314',
          800: '#9a6617',
          900: '#7c5318',
          950: '#432a09',
        },
        // Keep legacy colors for backward compatibility
        "brand-background": "#84a98c",
        "brand-primary": "#52796f", 
        "brand-accent": "#0ea5e9"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // Adicionar variáveis CSS do sidebar diretamente no tema Tailwind
      // Isso garante que o Tailwind as reconheça e as use para calcular larguras
      width: {
        sidebar: "var(--sidebar-width)",
        "sidebar-icon": "var(--sidebar-width-icon)",
      },
      margin: {
        sidebar: "var(--sidebar-width)",
        "sidebar-icon": "var(--sidebar-width-icon)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
