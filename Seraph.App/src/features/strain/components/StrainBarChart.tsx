import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { useTheme, type Theme } from '../../../theme';
import { StrainBars } from './StrainBars';

interface Props {
  anchorDate?: string;
}

export const StrainBarChart: React.FC<Props> = ({ anchorDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  return (
    <View style={sectionStyles.container}>
      <SafeText style={styles.title}>{t('common.sevenDayStrain')}</SafeText>
      <StrainBars anchorDate={anchorDate} />
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    title: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
  });
}
