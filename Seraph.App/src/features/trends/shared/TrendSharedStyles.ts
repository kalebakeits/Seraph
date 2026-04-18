import type { Theme } from '../../../theme';

export function buildTrendSharedStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    scrollContent: {
      gap: theme.spacing.md,
      paddingTop: theme.layout.screenPadding,
      paddingBottom: theme.tabStyles.content.paddingBottom,
    },
    controlRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
    },
    rangePills: {
      flexDirection: 'row' as const,
      gap: theme.spacing.xs,
    },
    rangeBtn: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      alignItems: 'center' as const,
    },
    rangeBtnText: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
    },
    dateRange: {
      flex: 1,
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textAlign: 'right' as const,
    },
    loading: {
      height: 270,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    summaryRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xs,
    },
    summaryItem: {
      alignItems: 'center' as const,
      flex: 1,
    },
    summaryLabel: {
      fontSize: 9,
      color: theme.colors.text.muted,
      letterSpacing: 0.6,
      fontWeight: theme.typography.weights.semibold,
    },
    summaryValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
      marginTop: theme.spacing.xxs,
    },
  };
}
