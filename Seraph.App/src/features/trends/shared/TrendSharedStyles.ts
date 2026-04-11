import { StyleSheet } from 'react-native';
import { theme } from '../../../theme';

export const trendSharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  scrollContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.tabStyles.content.paddingBottom,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rangePills: {
    flexDirection: 'row',
    gap: 4,
  },
  rangeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
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
    textAlign: 'right',
  },
  loading: {
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  summaryItem: {
    alignItems: 'center',
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
    marginTop: 2,
  },
});
