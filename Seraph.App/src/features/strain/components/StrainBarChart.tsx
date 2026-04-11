import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { theme } from '../../../theme';
import { StrainBars } from './StrainBars';

interface Props {
  anchorDate?: string;
}

export const StrainBarChart: React.FC<Props> = ({ anchorDate }) => {
  const { t } = useTranslation();
  return (
    <View style={sectionStyles.container}>
      <SafeText style={styles.title}>{t('common.sevenDayStrain')}</SafeText>
      <StrainBars anchorDate={anchorDate} />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
});
