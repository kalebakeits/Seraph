import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type NavProp = NativeStackNavigationProp<HomeStackParamList>;

interface MetricTileProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  onPress?: () => void;
}

const MetricTile: React.FC<MetricTileProps> = ({ iconName, label, value, onPress }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  return (
    <TouchableOpacity
      style={styles.tile}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.tileHeader}>
        <Ionicons name={iconName} size={14} color={theme.colors.sleep} />
        <SafeText style={styles.tileLabel}>{label}</SafeText>
      </View>
      <SafeText style={styles.tileValue}>{value}</SafeText>
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={12}
          color={theme.colors.text.muted}
          style={styles.tileChevron}
        />
      )}
    </TouchableOpacity>
  );
};

interface Props {
  avgHr: number | null;
  hrv: number | null;
  rhr: number | null;
  awakeMinutes: number;
  anchorDate?: string;
}

export const SleepSessionMetrics: React.FC<Props> = ({
  avgHr,
  hrv,
  rhr,
  awakeMinutes,
  anchorDate,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.grid}>
      <MetricTile
        iconName="heart-outline"
        label={t('sleep.avgHr')}
        value={avgHr != null ? t('sleep.avgHrValue', { value: Math.round(avgHr) }) : '--'}
        onPress={() => {
          navigation.navigate('TrendHr', { anchorDate });
        }}
      />
      <MetricTile
        iconName="pulse-outline"
        label={t('sleep.hrv')}
        value={hrv != null ? t('sleep.hrvValue', { value: Math.round(hrv) }) : '--'}
        onPress={() => {
          navigation.navigate('TrendHrv', { anchorDate });
        }}
      />
      <MetricTile
        iconName="heart-dislike-outline"
        label={t('sleep.rhr')}
        value={rhr != null ? t('sleep.rhrValue', { value: rhr }) : '--'}
        onPress={() => {
          navigation.navigate('TrendHr', { anchorDate });
        }}
      />
      <MetricTile
        iconName="eye-outline"
        label={t('sleep.stageAwake')}
        value={`${String(awakeMinutes)} min`}
        onPress={() => {
          navigation.navigate('TrendSleepAwake', { anchorDate });
        }}
      />
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    tile: {
      ...theme.cardStyles.default,
      flexBasis: '48%',
      flexGrow: 1,
      marginBottom: 0,
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      position: 'relative',
    },
    tileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    tileLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
    tileValue: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    tileChevron: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
    },
  });
}
