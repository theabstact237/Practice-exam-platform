/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ExamLandingPage builds color classes dynamically (e.g. `bg-${exam.color}-500/10`),
  // so those variants must be safelisted or Tailwind's JIT will purge them.
  safelist: [
    { pattern: /(bg|text|border|shadow|from|to)-(sky|emerald|orange|purple|fuchsia|amber|blue|green)-(400|500|600)/, variants: ['hover'] },
    { pattern: /(bg|border|shadow)-(sky|emerald|orange|purple|fuchsia|amber|blue|green)-500\/(10|20|30)/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
