/**
 * Design system tokens — colors, spacing, typography, shadows.
 * All UI components reference these values; never hardcode colors.
 */

export const Colors = {
  // Brand
  primary: '#38bdf8',       // sky-400
  primaryDark: '#0284c7',   // sky-600
  primaryLight: '#bae6fd',  // sky-200

  // Backgrounds
  bgDeep: '#0f172a',        // slate-900
  bgDark: '#1e293b',        // slate-800
  bgMid: '#334155',         // slate-700
  bgLight: '#475569',       // slate-600

  // Text
  textPrimary: '#f1f5f9',   // slate-100
  textSecondary: '#94a3b8', // slate-400
  textMuted: '#64748b',     // slate-500

  // Feedback
  success: '#10b981',       // emerald-500
  successLight: '#d1fae5',
  error: '#ef4444',         // red-500
  errorLight: '#fee2e2',
  warning: '#f59e0b',       // amber-500
  warningLight: '#fef3c7',

  // Gamification
  xpGold: '#fbbf24',        // amber-400
  heart: '#f43f5e',         // rose-500
  streak: '#f97316',        // orange-500
  gem: '#818cf8',           // indigo-400

  // Subjects
  python: '#22c55e',        // green-500
  javascript: '#eab308',    // yellow-500
  java: '#f97316',          // orange-500
  aws: '#38bdf8',           // sky-400
  promptEng: '#a855f7',     // purple-500
  aiFundamentals: '#6366f1', // indigo-500

  // Difficulty
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',

  // Borders
  border: '#334155',
  borderLight: '#475569',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
};
