import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { useTheme, type Theme } from '../../../theme';
import { RecoveryBars } from './RecoveryBars';
import type { RecoveryDay } from '../hooks/useRecoveryHistory';

interface Props {
  data: RecoveryDay[];
  height?: number;
}

export const RecoveryBarChart: React.FC<Props> = ({ data, height }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  return (
    <View style={sectionStyles.container}>
      <SafeText style={styles.title}>{t('recovery.sevenDay')}</SafeText>
      <RecoveryBars data={data} height={height} />
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
