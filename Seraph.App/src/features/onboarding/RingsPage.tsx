import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActivityRing } from '../../components/common/ActivityRing';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import { PageContainer } from './PageContainer';
import { styles as sharedStyles } from './OnboardingStyles';

interface Props {
  width: number;
}

const RINGS = [
  {
    key: 'strain',
    color: theme.colors.strain,
    value: 14.2,
    goal: 21,
    decimals: 1 as const,
  },
  {
    key: 'recovery',
    color: theme.colors.recovery,
    value: 76,
    goal: 100,
    unit: '%' as const,
  },
  {
    key: 'sleep',
    color: theme.colors.sleep,
    value: 83,
    goal: 100,
    unit: '%' as const,
  },
] as const;

export const RingsPage: React.FC<Props> = ({ width }) => {
  const { t } = useTranslation();

  return (
    <PageContainer width={width}>
      <SafeText style={sharedStyles.pageTitle}>{t('onboarding.rings.title')}</SafeText>
      <SafeText style={sharedStyles.pageSubtitle}>{t('onboarding.rings.subtitle')}</SafeText>

      <View style={styles.list}>
        {RINGS.map(ring => (
          <View key={ring.key} style={styles.row}>
            <ActivityRing
              value={ring.value}
              goal={ring.goal}
              size={72}
              strokeWidth={6}
              color={ring.color}
              label=""
              unit={'unit' in ring ? ring.unit : ''}
              decimals={'decimals' in ring ? ring.decimals : undefined}
            />
            <View style={styles.textBlock}>
              <SafeText style={[styles.ringName, { color: ring.color }]}>
                {t(`onboarding.rings.${ring.key}`)}
              </SafeText>
              <SafeText style={styles.ringDesc}>{t(`onboarding.rings.${ring.key}Desc`)}</SafeText>
            </View>
          </View>
        ))}
      </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  ringName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  ringDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
