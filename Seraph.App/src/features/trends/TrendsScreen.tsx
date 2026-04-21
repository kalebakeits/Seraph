import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeText } from '../../components/common/SafeText';
import { useTheme, type Theme } from '../../theme';
import { buildTrendSharedStyles } from './shared/TrendSharedStyles';
import { TREND_CONFIG, type TrendKey } from './TrendConfig';
import { TrendPicker } from './TrendPicker';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import type { TrendRange } from './useTrendData';

type Props = NativeStackScreenProps<HomeStackParamList, 'Trends'>;

const DEFAULT_TREND: TrendKey = 'strain';

export const TrendsScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const s = buildTrendSharedStyles(theme);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { initialTrend, anchorDate } = route.params ?? {};

  const [selectedKey, setSelectedKey] = useState<TrendKey>(initialTrend ?? DEFAULT_TREND);
  const [range, setRange] = useState<TrendRange>('1W');
  const [pickerOpen, setPickerOpen] = useState(false);

  const cfg = TREND_CONFIG[selectedKey];
  const color = cfg.getColor(theme);
  const { Content } = cfg;

  return (
    <View style={s.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <SafeText style={styles.title}>{t('nav.trends')}</SafeText>
        <TouchableOpacity
          style={styles.picker}
          activeOpacity={0.7}
          onPress={() => {
            setPickerOpen(true);
          }}
        >
          <View
            style={[
              styles.pickerIconCircle,
              { backgroundColor: cfg.getTint(theme), borderColor: color },
            ]}
          >
            <Ionicons name={cfg.icon} size={14} color={color} />
          </View>
          <SafeText style={[styles.pickerLabel, { color }]}>{t(cfg.nameKey)}</SafeText>
          <Ionicons name="chevron-down" size={14} color={color} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Content
          key={selectedKey}
          range={range}
          onRangeChange={setRange}
          anchorDate={anchorDate}
          theme={theme}
        />
      </ScrollView>

      {pickerOpen && (
        <TrendPicker
          selected={selectedKey}
          onSelect={key => {
            setSelectedKey(key);
            setRange('1W');
          }}
          onClose={() => {
            setPickerOpen(false);
          }}
        />
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    picker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    },
    pickerIconCircle: {
      width: 22,
      height: 22,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
    },
  });
}
