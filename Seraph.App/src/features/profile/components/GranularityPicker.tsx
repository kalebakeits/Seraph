import React from 'react';
import { View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { theme } from '../../../theme';
import { GRANULARITY_OPTIONS, type GranularitySeconds } from '../utils/storageUtils';

interface Props {
  value: GranularitySeconds;
  onChange: (value: GranularitySeconds) => void;
}

export const GranularityPicker: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const index = GRANULARITY_OPTIONS.indexOf(value);

  const handleSlidingComplete = (sliderValue: number) => {
    const snapped = GRANULARITY_OPTIONS[Math.round(sliderValue)] ?? GRANULARITY_OPTIONS[0];
    onChange(snapped);
  };

  const optionLabel = (s: GranularitySeconds) =>
    s === 1
      ? t('settings.storage.granularityOption_1')
      : t('settings.storage.granularityOption_other', { seconds: s });

  return (
    <>
      <SafeText style={sectionStyles.sectionTitle}>
        {t('settings.storage.granularityTitle')}
      </SafeText>
      <SafeText style={styles.hint}>{t('settings.storage.granularityHint')}</SafeText>
      <View style={sectionStyles.container}>
        <SafeText style={styles.currentValue}>{optionLabel(value)}</SafeText>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={GRANULARITY_OPTIONS.length - 1}
          step={1}
          value={index}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.15)"
          thumbTintColor={theme.colors.primary}
        />
        <View style={styles.endpoints}>
          <SafeText style={styles.endLabel}>{t('settings.storage.accuracyHigh')}</SafeText>
          <SafeText style={styles.endLabel}>{t('settings.storage.accuracyLow')}</SafeText>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  hint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  currentValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
    paddingTop: theme.spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  endpoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  endLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
});
