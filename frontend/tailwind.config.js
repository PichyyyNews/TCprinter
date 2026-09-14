/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kumo: {
          canvas: 'var(--kumo-canvas, #0a0a0a)',
          base: 'var(--kumo-base, #141414)',
          elevated: 'var(--kumo-elevated, #1c1c1c)',
          recessed: 'var(--kumo-recessed, #0f0f0f)',
          control: 'var(--kumo-control, #242424)',
          tint: 'var(--kumo-tint, rgba(255, 255, 255, 0.06))',
          default: 'var(--kumo-default, #f3f3f3)',
          subtle: 'var(--kumo-subtle, #888888)',
          strong: 'var(--kumo-strong, #ffffff)',
          line: 'var(--kumo-line, #2a2a2a)',
          hairline: 'var(--kumo-hairline, #1f1f1f)',
          brand: 'var(--kumo-brand, #F6821F)', // Cloudflare Brand Orange
          success: 'var(--kumo-success, #10b981)',
          warning: 'var(--kumo-warning, #f59e0b)',
          critical: 'var(--kumo-critical, #ef4444)',
        },
      },
    },
  },
  plugins: [],
};
