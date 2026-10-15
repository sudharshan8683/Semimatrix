/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand & dark theme navy scale
        navy: {
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#C2D7EC',
          300: '#94BCDE',
          400: '#5C98C9',
          500: '#2A6FA8',
          600: '#1B4D7E',
          700: '#16324F', // Primary enterprise navy
          800: '#0F2338',
          900: '#0A1726',
          950: '#050D15',
        },
        // Restrained accent amber for primary highlights, warnings, and key CTA
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F5A623', // Primary accent
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Clean neutral surfaces
        slate: {
          25: '#FCFCFD',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#0B111D',
        },
        // Functional semantics (WCAG AA compliant)
        brand: {
          DEFAULT: '#16324F',
          primary: '#16324F',
          accent: '#F5A623',
          light: '#F0F5FA',
          dark: '#0F2338',
        },
        status: {
          running: '#16803D',
          idle: '#64748B',
          warning: '#B54708',
          critical: '#D92D20',
          maintenance: '#6941C6',
          info: '#175CD3',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"IBM Plex Sans"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        card: '0 1px 3px 0 rgba(16, 24, 40, 0.08), 0 1px 2px -1px rgba(16, 24, 40, 0.08)',
        elevated: '0 4px 6px -1px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        dropdown: '0 10px 15px -3px rgba(16, 24, 40, 0.1), 0 4px 6px -4px rgba(16, 24, 40, 0.08)',
      }
    },
  },
  plugins: [],
}
