/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Flat aliases for zero-ambiguity PostCSS class generation
        'sidebar-bg': '#0B1220',
        'sidebar-card': '#111B2E',
        'sidebar-active': '#202C4C',
        'sidebar-text': '#E5EAF5',
        'sidebar-muted': '#9AA8C1',
        'sidebar-border': 'rgba(255, 255, 255, 0.08)',

        'workspace-bg': '#F5F7FC',
        'workspace-card': '#FFFFFF',
        'workspace-text': '#172033',
        'workspace-muted': '#64748B',
        'workspace-border': '#E5EAF2',

        'brand-indigo': '#5B5CF0',
        'brand-purple': '#8B5CF6',
        'brand-purpleLight': '#F0EDFF',
        'brand-blue': '#3B82F6',
        'brand-cyan': '#06B6D4',
        'brand-teal': '#0F9F78',
        'brand-emerald': '#10B981',
        'brand-orange': '#F97316',
        'brand-pink': '#EC4899',
        'brand-dark': '#0B1220',

        // Nested structure for group styling
        sidebar: {
          bg: '#0B1220',
          card: '#111B2E',
          active: '#202C4C',
          text: '#E5EAF5',
          muted: '#9AA8C1',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        workspace: {
          bg: '#F5F7FC',
          card: '#FFFFFF',
          text: '#172033',
          muted: '#64748B',
          border: '#E5EAF2'
        },
        brand: {
          indigo: '#5B5CF0',
          purple: '#8B5CF6',
          purpleLight: '#F0EDFF',
          blue: '#3B82F6',
          cyan: '#06B6D4',
          teal: '#0F9F78',
          emerald: '#10B981',
          orange: '#F97316',
          pink: '#EC4899',
          dark: '#0B1220'
        }
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 12px 30px -5px rgba(0, 0, 0, 0.08), 0 8px 12px -6px rgba(0, 0, 0, 0.03)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.06)',
        'glow-indigo': '0 0 20px rgba(91, 92, 240, 0.35)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.35)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }
    },
  },
  plugins: [],
}
