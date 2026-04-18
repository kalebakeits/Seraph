// Theme factory — builds a full theme from a colour palette.
// All non-colour tokens (spacing, typography, layout, etc.) are shared across themes.

import type { ColorPalette } from './palettes';
import { midnightPurple } from './palettes';

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const spacing = {
  xxs: 2,
  xs: 4,
  smx: 6,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Border radius ────────────────────────────────────────────────────────────
export const borderRadius = {
  xs: 2,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ─── Border widths ────────────────────────────────────────────────────────────
export const borderWidth = {
  hairline: 0.5,
  thin: 1,
  medium: 1.5,
  thick: 4,
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const typography = {
  sizes: {
    tick: 9,
    chartLabel: 10,
    tabLabel: 11,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    // Card-level hero numbers (HRV, sleep hours, strain, recovery score)
    hero: 32,
    // Full-screen display numbers (nap timer, live HR, wake-up time)
    display: 52,
    displayLg: 72,
    displayXl: 80,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tight: 0.5,
    normal: 0.6,
    wide: 0.8,
    caps: 1,
    xCaps: 2,
  },
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  sectionSpacing: spacing.lg,
  floatingTabBarHeight: 68,
  floatingTabBarBottomOffset: 12,
  headerClearance: 80,
  headerClearanceTall: 100,
  iconSize: {
    sm: 32,
    md: 36,
    lg: 48,
  },
  legendDot: 6,
  legendDotLg: 8,
  chartLabelWidth: 44,
};

// ─── Animations ───────────────────────────────────────────────────────────────
export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// ─── Theme factory ────────────────────────────────────────────────────────────
// Builds derived style objects that depend on colours, then assembles the full theme.
export function buildTheme(colors: ColorPalette) {
  const shadows = {
    sm: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    md: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 20,
    },
    lg: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
  };

  const cardStyles = {
    default: {
      backgroundColor: colors.surface.card,
      borderRadius: borderRadius.md,
      padding: layout.cardPadding,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.surface.card,
      borderRadius: borderRadius.lg,
      padding: layout.cardPadding,
      ...shadows.md,
    },
  };

  const tabStyles = {
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

  const liquidGlassButton = {
    base: {
      backgroundColor: colors.overlay.medium,
      borderWidth: borderWidth.thin,
      borderColor: colors.border.default,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...shadows.sm,
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

  return {
    colors,
    spacing,
    borderRadius,
    borderWidth,
    typography,
    shadows,
    layout,
    animations,
    cardStyles,
    tabStyles,
    liquidGlassButton,
  };
}

// ─── Default static theme (Midnight Purple) ───────────────────────────────────
// Used only for static style files (SectionStyles, TrendSharedStyles, etc.)
// that can't call hooks. All components should use useTheme() instead.
export const theme = buildTheme(midnightPurple);

export type Theme = ReturnType<typeof buildTheme>;

// Re-export palette types for consumers
export type { ColorPalette, ThemeName } from './palettes';
export { palettes } from './palettes';

// Re-export ThemeContext so consumers can import from '../theme'
export { useTheme, ThemeProvider } from './ThemeContext';
export type { ThemeContextValue } from './ThemeContext';
