import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ActivityRing } from '../../../../components/common/ActivityRing';
import { theme } from '../../../../theme';
import type { HomeStackParamList } from '../../../../navigation/HomeStackNavigator';
import type { ActivityRingsData } from '../../hooks/useActivityRings';
import { useRecommendedStrain } from '../../../strain/hooks/useRecommendedStrain';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface ActivityRingsProps {
  selectedDate?: string;
  rings?: ActivityRingsData;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({ selectedDate, rings }) => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const ringSize = 85;
  const { data: recommended } = useRecommendedStrain(selectedDate);

  return (
    <View style={styles.ringsRow}>
      <ActivityRing
        value={rings?.strain.value ?? null}
        goal={rings?.strain.goal ?? 21}
        size={ringSize}
        strokeWidth={6}
        color={theme.colors.strain}
        label={t('home.strain')}
        decimals={1}
        targetLow={recommended.low}
        targetHigh={recommended.high}
        onPress={() => {
          navigation.navigate('Strain', { selectedDate });
        }}
      />
      <ActivityRing
        value={rings?.recovery.value ?? null}
        goal={rings?.recovery.goal ?? 100}
        size={ringSize}
        strokeWidth={6}
        color={theme.colors.recovery}
        label={t('home.recovery')}
        unit="%"
        onPress={() => {
          navigation.navigate('Recovery', { selectedDate });
        }}
      />
      <ActivityRing
        value={rings?.sleep.value ?? null}
        goal={rings?.sleep.goal ?? 100}
        size={ringSize}
        strokeWidth={6}
        color={theme.colors.sleep}
        label={t('home.sleep')}
        unit="%"
        onPress={() => {
          navigation.navigate('Sleep', { selectedDate });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
});
