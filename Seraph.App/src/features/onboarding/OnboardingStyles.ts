import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';

export function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.smx,
      paddingVertical: theme.spacing.md,
    },
    dot: {
      width: theme.layout.legendDot,
      height: theme.layout.legendDot,
      borderRadius: 3,
      backgroundColor: theme.colors.overlay.strong,
    },
    dotActive: {
      width: 18,
      backgroundColor: theme.colors.primary,
    },
    page: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      minWidth: 80,
    },
    backText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.smx,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm + 2,
      borderRadius: theme.borderRadius.full,
    },
    nextText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.icon.onLight,
    },
    skipBtn: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
    },
    skipText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.secondary,
    },
    // Welcome
    welcomeContent: {
      flex: 1,
      justifyContent: 'center',
      gap: theme.spacing.lg,
    },
    welcomeIconRow: {
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    welcomeLogo: {
      width: 140,
      height: 140,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    welcomeBody: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    featureList: {
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    featureText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    // Profile
    pageTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    pageSubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.lg,
      lineHeight: 20,
    },
    privacyNote: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.lg,
      lineHeight: 18,
    },
    fieldGroup: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
      letterSpacing: 0.8,
    },
    fieldHint: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      lineHeight: 18,
      marginTop: theme.spacing.xxs,
    },
    input: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.default,
    },
    pickerValue: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
    },
    twoCol: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    segmented: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    segment: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.overlay.medium,
      backgroundColor: theme.colors.overlay.muted,
    },
    segmentText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    // Sensitivity
    sensitivityList: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    sensitivityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.overlay.light,
      backgroundColor: theme.colors.overlay.ghost,
      gap: theme.spacing.sm,
    },
    sensitivityRowActive: {
      borderColor: theme.colors.strain,
      backgroundColor: theme.colors.iconTint.primary,
    },
    sensitivityLeft: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    sensitivityLabel: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    sensitivityDesc: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
    sensitivityBar: {
      height: 4,
      maxWidth: 60,
      borderRadius: 2,
    },
    sensitivityBarFill: {
      flex: 1,
      borderRadius: 2,
    },
    sensitivityHint: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textAlign: 'center',
      lineHeight: 18,
    },
    // Tutorial
    tutorialIconWrap: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    tutorialIconBg: {
      width: 80,
      height: 80,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bulletList: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    bulletDot: {
      width: theme.layout.legendDot,
      height: theme.layout.legendDot,
      borderRadius: 3,
      marginTop: 7,
    },
    bulletText: {
      flex: 1,
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    // Done
    doneContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    doneIconWrap: {
      marginBottom: theme.spacing.sm,
    },
    doneTitle: {
      fontSize: 28,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    doneBody: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    doneTip: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: theme.spacing.md,
    },
  });
}
