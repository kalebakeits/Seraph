import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import { PageContainer } from './PageContainer';
import { styles as sharedStyles } from './OnboardingStyles';

interface Props {
  width: number;
}

export const OverviewTourPage: React.FC<Props> = ({ width }) => {
  const { t } = useTranslation();

  return (
    <PageContainer width={width}>
      <SafeText style={sharedStyles.pageTitle}>{t('onboarding.tour.title')}</SafeText>
      <SafeText style={sharedStyles.pageSubtitle}>{t('onboarding.tour.subtitle')}</SafeText>

      {/* Fake header */}
      <View style={styles.fakeHeader}>
        <View style={styles.fakeIconBtn}>
          <Ionicons name="settings-outline" size={18} color={theme.colors.text.primary} />
        </View>
        <View style={styles.fakeDateNav}>
          <Ionicons name="chevron-back" size={14} color={theme.colors.text.primary} />
          <SafeText style={styles.fakeDateText}>Tue, Apr 1</SafeText>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.text.muted} />
        </View>
        <View style={styles.fakeDeviceStatus}>
          <View style={styles.fakeStatusDot} />
          <SafeText style={styles.fakeStatusText}>Synced</SafeText>
        </View>
      </View>

      {/* Callouts for header */}
      <View style={styles.calloutGroup}>
        <View style={styles.callout}>
          <View style={[styles.calloutDot, { backgroundColor: theme.colors.text.muted }]} />
          <SafeText style={styles.calloutText}>{t('onboarding.tour.settings')}</SafeText>
        </View>
        <View style={styles.callout}>
          <View style={[styles.calloutDot, { backgroundColor: theme.colors.primary }]} />
          <SafeText style={styles.calloutText}>{t('onboarding.tour.dateNav')}</SafeText>
        </View>
        <View style={styles.callout}>
          <View style={[styles.calloutDot, { backgroundColor: theme.colors.recovery }]} />
          <SafeText style={styles.calloutText}>{t('onboarding.tour.device')}</SafeText>
        </View>
      </View>

      {/* Fake overview content */}
      <View style={styles.fakeOverview}>
        {/* Fake rings row */}
        <View style={styles.fakeRingsRow}>
          {[theme.colors.strain, theme.colors.recovery, theme.colors.sleep].map(color => (
            <View key={color} style={styles.fakeRing}>
              <View style={[styles.fakeRingOuter, { borderColor: color }]}>
                <View style={[styles.fakeRingInner, { backgroundColor: color + '33' }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Fake activities section */}
        <View style={styles.fakeSection}>
          <SafeText style={styles.fakeSectionTitle}>{t('onboarding.tour.activities')}</SafeText>
          <View style={styles.fakeActivityRow}>
            <Ionicons name="moon-outline" size={14} color={theme.colors.sleep} />
            <SafeText style={styles.fakeActivityText}>Sleep 7h 42m</SafeText>
          </View>
          <View style={styles.fakeActivityRow}>
            <Ionicons name="bicycle-outline" size={14} color={theme.colors.strain} />
            <SafeText style={styles.fakeActivityText}>Ride 1h 10m</SafeText>
          </View>
        </View>
      </View>

      {/* Callouts for overview */}
      <View style={styles.calloutGroup}>
        <View style={styles.callout}>
          <View style={[styles.calloutDot, { backgroundColor: theme.colors.strain }]} />
          <SafeText style={styles.calloutText}>{t('onboarding.tour.rings')}</SafeText>
        </View>
        <View style={styles.callout}>
          <View style={[styles.calloutDot, { backgroundColor: theme.colors.sleep }]} />
          <SafeText style={styles.calloutText}>{t('onboarding.tour.activitiesDesc')}</SafeText>
        </View>
      </View>

      <SafeText style={styles.swipeHint}>{t('onboarding.tour.swipeHint')}</SafeText>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  fakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.overlay.medium,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  fakeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.overlay.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeDateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.overlay.light,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  fakeDateText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  fakeDeviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fakeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.recovery,
  },
  fakeStatusText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  calloutGroup: {
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  calloutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  calloutText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  fakeOverview: {
    backgroundColor: theme.colors.overlay.medium,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  fakeRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fakeRing: {
    alignItems: 'center',
  },
  fakeRingOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeRingInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  fakeSection: {
    gap: 6,
  },
  fakeSectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fakeActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  fakeActivityText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  swipeHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: theme.spacing.sm,
  },
});
