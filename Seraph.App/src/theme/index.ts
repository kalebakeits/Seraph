// Central theme configuration - your "values.yaml" for the app

export const colors = {
  // Background
  background: '#150029',

  // Gradients
  gradients: {
    card: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  },

  // Primary colors
  primary: '#f45b5b',
  secondary: '#c94444',

  // Status colors
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#f5576c',
  info: '#4facfe',

  // Metrics colors
  strain: '#f45b5bff',
  recovery: '#67ffb0ff',
  sleep: '#51b5efff',

  // Sleep stage colors
  sleepStages: {
    rem: '#7c6bff',
    deep: '#4a9fff',
    light: '#a8d4ffff',
  },

  // HR zone colors (Z1–Z5)
  zones: ['#4facfe', '#2ecc71', '#f9ca24', '#f0932b', '#f5576c'] as const,

  // Gauge colors
  gaugeColors: {
    vo2Max: ['#f5576c', '#feca57', '#71b280', '#4facfe'] as const, // poor → moderate → good → excellent
    trainingLoad: ['#feca57', '#71b280', '#71b280', '#f5576c'] as const, // underload → optimal → optimal → overload
    recovery: ['#f5576c', '#feca57', '#71b280'] as const, // poor → moderate → good
    hrv: ['#f5576c', '#feca57', '#71b280'] as const, // low → moderate → good
  },

  // Activity colors
  steps: '#f4bfefff',
  calories: '#f4bfefff',
  active: '#f4bfefff',
  skinTemp: '#FF8C42',

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    muted: 'rgba(255, 255, 255, 0.4)',
  },

  // Background overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(0, 0, 0, 0.3)',
  },

  // Surface colors
  surface: {
    sheet: '#1a0033',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    hero: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  sectionSpacing: spacing.lg,
  // Floating tab bar geometry — used to compute bottom padding on scrollable screens.
  // Tab pill height (52) + vertical padding (8+8). Bar sits 12pt above the safe area bottom.
  floatingTabBarHeight: 68,
  floatingTabBarBottomOffset: 12,
};

export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// Helper to create consistent card styles
export const cardStyles = {
  default: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  elevated: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    padding: layout.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
};

// Shared tab styles
export const tabStyles = {
  container: {
    flex: 1,
    backgroundColor: 'transparent' as const,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: layout.floatingTabBarHeight + layout.floatingTabBarBottomOffset + 34,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
};

// Liquid glass button styles
export const liquidGlassButton = {
  base: {
    backgroundColor: colors.overlay.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  disabled: {
    opacity: 0.5,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  layout,
  animations,
  cardStyles,
  tabStyles,
  liquidGlassButton,
};

export type Theme = typeof theme;
