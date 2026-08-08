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
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        fluid: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.25rem, 1rem + 1.2vw, 1.6rem)',
        'fluid-xl': 'clamp(2rem, 1.45rem + 2.4vw, 3.25rem)',
        'fluid-2xl': 'clamp(2.6rem, 1.8rem + 3.6vw, 4rem)',
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
