import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeText } from '../../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../../theme';
import type { HomeStackParamList } from '../../../../navigation/HomeStackNavigator';
import type { TrendKey } from '../../../trends/TrendConfig';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export interface MetricCardProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconTint: string;
  label: string;
  current: number | null;
  previous: number | null;
  unit: string;
  format?: (v: number) => string;
  trendKey: TrendKey;
  anchorDate?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  iconName,
  iconColor,
  iconTint,
  label,
  current,
  previous,
  unit,
  format,
  trendKey,
  anchorDate,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp>();
  const fmt = format ?? ((v: number) => v.toLocaleString());
  const currentStr = current !== null ? `${fmt(current)}${unit}` : '--';
  const previousStr = previous !== null ? `${fmt(previous)}${unit}` : '--';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('Trends', { initialTrend: trendKey, anchorDate });
      }}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: iconTint, borderColor: iconColor }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
        <SafeText style={styles.label}>{label}</SafeText>
      </View>
      <SafeText style={styles.currentValue}>{currentStr}</SafeText>
      <SafeText style={styles.previousValue}>{previousStr}</SafeText>
    </TouchableOpacity>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      ...theme.cardStyles.default,
      marginBottom: 0,
      flexBasis: '48%',
      justifyContent: 'flex-start',
      paddingVertical: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
    currentValue: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    previousValue: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.xxs,
    },
  });
}
