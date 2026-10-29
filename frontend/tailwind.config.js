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
        // Core cinematic dark tokens per prompt specifications
        'main-bg': '#06080F',
        'sidebar-bg': '#0A0F1D',
        'card-primary': '#0E1628',
        'card-elevated': '#111C30',
        'input-bg': '#0B1220',

        // Flat aliases for backwards compatibility
        'sidebar-card': '#111C30',
        'sidebar-active': '#1E293B',
        'sidebar-text': '#F1F5F9',
        'sidebar-muted': '#94A3B8',
        'sidebar-border': 'rgba(255, 255, 255, 0.08)',

        'workspace-bg': '#06080F',
        'workspace-card': '#0E1628',
        'workspace-text': '#F1F5F9',
        'workspace-muted': '#94A3B8',
        'workspace-border': 'rgba(255, 255, 255, 0.08)',

        'brand-indigo': '#6366F1',
        'brand-purple': '#8B5CF6',
        'brand-violet': '#8B5CF6',
        'brand-purpleLight': 'rgba(139, 92, 246, 0.15)',
        'brand-blue': '#3B82F6',
        'brand-cyan': '#06B6D4',
        'brand-teal': '#06B6D4',
        'brand-emerald': '#34D399',
        'brand-orange': '#F59E0B',
        'brand-amber': '#FBBF24',
        'brand-rose': '#FB7185',
        'brand-pink': '#EC4899',
        'brand-dark': '#06080F',

        // Nested structure for group styling
        sidebar: {
          bg: '#0A0F1D',
          card: '#111C30',
          active: '#1E293B',
          text: '#F1F5F9',
          muted: '#94A3B8',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        workspace: {
          bg: '#06080F',
          card: '#0E1628',
          text: '#F1F5F9',
          muted: '#94A3B8',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        brand: {
          indigo: '#6366F1',
          purple: '#8B5CF6',
          violet: '#8B5CF6',
          purpleLight: 'rgba(139, 92, 246, 0.15)',
          blue: '#3B82F6',
          cyan: '#06B6D4',
          teal: '#06B6D4',
          emerald: '#34D399',
          orange: '#F59E0B',
          amber: '#FBBF24',
          rose: '#FB7185',
          pink: '#EC4899',
          dark: '#06080F'
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
