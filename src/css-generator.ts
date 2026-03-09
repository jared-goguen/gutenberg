import type { ThemeSpec } from "chromata";

/**
 * Generate complete static CSS bundle
 * Replaces Tailwind CDN with self-contained utilities
 */
export function generateUtilityCSS(theme: ThemeSpec): string {
  return `
/* Base Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { line-height: 1.5; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
body { font-family: system-ui, -apple-system, sans-serif; }
img { display: block; max-width: 100%; height: auto; }

/* Layout */
.container { max-width: 1280px; margin: 0 auto; padding: 0 1rem; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.max-w-4xl { max-width: 56rem; }
.max-w-7xl { max-width: 80rem; }
.max-w-full { max-width: 100%; }
.mx-auto { margin-left: auto; margin-right: auto; }
.w-full { width: 100%; }
.h-auto { height: auto; }
.min-h-screen { min-height: 100vh; }
.relative { position: relative; }
.absolute { position: absolute; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.z-10 { z-index: 10; }

/* Spacing */
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.py-16 { padding-top: 4rem; padding-bottom: 4rem; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.py-24 { padding-top: 6rem; padding-bottom: 6rem; }
.py-32 { padding-top: 8rem; padding-bottom: 8rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }
.gap-12 { gap: 3rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.space-y-8 > * + * { margin-top: 2rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-10 { margin-bottom: 2.5rem; }
.mt-8 { margin-top: 2rem; }
.mt-10 { margin-top: 2.5rem; }
.mt-16 { margin-top: 4rem; }

/* Typography */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-5xl { font-size: 3rem; line-height: 1; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-7xl { font-size: 4.5rem; line-height: 1; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.leading-tight { line-height: 1.25; }
.leading-snug { line-height: 1.375; }
.leading-normal { line-height: 1.5; }
.tracking-tight { letter-spacing: -0.025em; }
.text-center { text-align: center; }
.antialiased { -webkit-font-smoothing: antialiased; }

/* Effects */
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
.opacity-60 { opacity: 0.6; }
.opacity-80 { opacity: 0.8; }
.opacity-90 { opacity: 0.9; }
.overflow-hidden { overflow: hidden; }

/* Responsive */
@media (min-width: 640px) {
  .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .sm\\:flex-row { flex-direction: row; }
  .sm\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
}

@media (min-width: 768px) {
  .md\\:grid { display: grid; }
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
  .md\\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .md\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
  .md\\:text-5xl { font-size: 3rem; line-height: 1; }
  .md\\:text-6xl { font-size: 3.75rem; line-height: 1; }
  .md\\:py-16 { padding-top: 4rem; padding-bottom: 4rem; }
  .md\\:py-24 { padding-top: 6rem; padding-bottom: 6rem; }
}

@media (min-width: 1024px) {
  .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
  .lg\\:text-7xl { font-size: 4.5rem; line-height: 1; }
  .lg\\:py-32 { padding-top: 8rem; padding-bottom: 8rem; }
}
`.trim();
}
