import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';

export const CoachScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <SafeText style={styles.screenTitle}>{t('nav.coach')}</SafeText>
      <View style={styles.comingSoon}>
        <SafeText style={styles.comingSoonText}>{t('comingSoon.title')}</SafeText>
        <SafeText style={styles.comingSoonSub}>{t('comingSoon.coach')}</SafeText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  screenTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  comingSoonText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.secondary,
  },
  comingSoonSub: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
  },
});
