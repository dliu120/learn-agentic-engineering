/** @type {import('tailwindcss').Config} */
// Colors map to CSS custom properties (RGB triplets) defined in src/styles/global.css,
// so the same token names resolve to dark/light values via [data-theme] without rebuilding.
const withVar = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,vue,svelte}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: withVar('--bg'),
        surface: withVar('--surface'),
        'surface-2': withVar('--surface-2'),
        text: withVar('--text'),
        'text-muted': withVar('--text-muted'),
        'text-faint': withVar('--text-faint'),
        border: withVar('--border'),
        accent: withVar('--accent'),
        'accent-2': withVar('--accent-2'),
        'signal-good': withVar('--signal-good'),
        'signal-warn': withVar('--signal-warn'),
        'signal-bad': withVar('--signal-bad'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        fluid: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.25rem, 1rem + 1.2vw, 1.6rem)',
        'fluid-xl': 'clamp(1.75rem, 1.2rem + 2.5vw, 3rem)',
        'fluid-2xl': 'clamp(2.25rem, 1.4rem + 4vw, 4.25rem)',
      },
      maxWidth: { prose: '72ch' },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.35), 0 0 24px -6px rgb(var(--accent) / 0.4)',
      },
      keyframes: {
        'pulse-node': {
          '0%,100%': { opacity: '1', filter: 'drop-shadow(0 0 0 rgb(var(--accent)/0))' },
          '50%': { opacity: '0.85', filter: 'drop-shadow(0 0 8px rgb(var(--accent)/0.7))' },
        },
      },
      animation: { 'pulse-node': 'pulse-node 1.8s ease-in-out infinite' },
    },
  },
  plugins: [],
};
