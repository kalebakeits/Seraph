import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { theme } from '../../../theme';
import { RecoveryBars } from './RecoveryBars';
import type { RecoveryDay } from '../hooks/useRecoveryHistory';

interface Props {
  data: RecoveryDay[];
  height?: number;
}

export const RecoveryBarChart: React.FC<Props> = ({ data, height }) => {
  const { t } = useTranslation();
  return (
    <View style={sectionStyles.container}>
      <SafeText style={styles.title}>{t('recovery.sevenDay')}</SafeText>
      <RecoveryBars data={data} height={height} />
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
