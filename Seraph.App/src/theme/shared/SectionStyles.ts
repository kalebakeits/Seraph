import { StyleSheet } from 'react-native';
import type { Theme } from '..';

export function buildSectionStyles(theme: Theme) {
  return StyleSheet.create({
    sectionTitle: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: theme.spacing.xxs,
    },
    section: {
      gap: theme.spacing.xs,
    },
    container: {
      ...theme.cardStyles.default,
    },
    sectionLabel: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xxs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    dismissableSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xxs,
    },
  });
}
