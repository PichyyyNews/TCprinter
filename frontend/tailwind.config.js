/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kumo: {
          canvas: 'var(--kumo-canvas, #fafafa)',
          base: 'var(--kumo-base, #ffffff)',
          elevated: 'var(--kumo-elevated, #ffffff)',
          recessed: 'var(--kumo-recessed, #f4f4f5)',
          control: 'var(--kumo-control, #ffffff)',
          tint: 'var(--kumo-tint, rgba(0, 0, 0, 0.04))',
          default: 'var(--kumo-default, #171717)',
          subtle: 'var(--kumo-subtle, #737373)',
          strong: 'var(--kumo-strong, #0a0a0a)',
          line: 'var(--kumo-line, #e5e5e5)',
          hairline: 'var(--kumo-hairline, #f0f0f0)',
          brand: 'var(--kumo-brand, #F6821F)', // Cloudflare Orange
          brandHover: 'var(--kumo-brand-hover, #E06B08)',
          success: 'var(--kumo-success, #10b981)',
          warning: 'var(--kumo-warning, #f59e0b)',
          critical: 'var(--kumo-critical, #ef4444)',
        },
      },
      fontSize: {
        sm: ['14px', '20px'],
        base: ['14px', '20px'], // Rule 1: All content text is 14px
      },
    },
  },
  plugins: [],
};
