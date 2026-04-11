import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { SafeText } from '../../components/common/SafeText';
import { Section } from '../../components/common/Section';
import { HelperText } from '../../components/common/HelperText';
import { RecoveryCard } from './components/RecoveryCard';
import { RecoveryBarChart } from './components/RecoveryBarChart';
import { useRecoveryFactors } from './hooks/useRecoveryFactors';
import { useRecoveryHistory } from './hooks/useRecoveryHistory';
import { theme } from '../../theme';
import { todayISO, formatDateHeader } from '../../utils/dateUtils';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'Recovery'>;
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

export const Recovery: React.FC<Props> = ({ route }) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const date = route.params?.selectedDate ?? todayISO();
  const { data: factors } = useRecoveryFactors(date);
  const { data: history = [] } = useRecoveryHistory(date);

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <SafeText style={styles.dateHeader}>{formatDateHeader(date, i18n.language)}</SafeText>
      <HelperText translationKey="recovery.pageHelper" />

      <Section title={t('common.today')}>
        <HelperText translationKey="recovery.todayHelper" />
        <RecoveryCard data={factors} />
      </Section>

      <Section
        title={t('recovery.trends')}
        onTitlePress={() => {
          navigation.navigate('TrendRecovery', { anchorDate: route.params?.selectedDate });
        }}
      >
        <HelperText translationKey="recovery.historyHelper" />
        <RecoveryBarChart data={history} />
      </Section>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  dateHeader: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    paddingHorizontal: 2,
    marginBottom: theme.spacing.xs,
  },
});
