import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import type { ZoneSeconds } from '../../services/database/drizzle/schema';

const ZONE_COLORS = theme.colors.zones;
const ZONE_KEYS = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

const CHART_HEIGHT = 120;
const Y_AXIS_WIDTH = 32;

function fmtMin(secs: number, t: ReturnType<typeof useTranslation>['t']) {
  const m = Math.floor(secs / 60);
  return m === 0 ? `${String(secs)}${t('common.s')}` : `${String(m)}${t('common.min')}`;
}

interface Props {
  zoneSeconds: ZoneSeconds;
}

export const WorkoutZonesCard: React.FC<Props> = ({ zoneSeconds }) => {
  const { t } = useTranslation();
  const values = ZONE_KEYS.map(k => zoneSeconds[k]);
  const maxVal = Math.max(...values, 1);

  // Y-axis ticks: 0, half, max
  const ticks = [maxVal, maxVal / 2, 0];

  return (
    <View style={styles.card}>
      <SafeText style={styles.heading}>{t('workout.hrZones')}</SafeText>
      <View style={styles.chartArea}>
        {/* Y-axis */}
        <View style={styles.yAxis}>
          {ticks.map(tick => (
            <SafeText key={tick} style={styles.yLabel}>
              {fmtMin(tick, t)}
            </SafeText>
          ))}
        </View>

        {/* Bars + X-axis */}
        <View style={styles.barsWrapper}>
          <View style={styles.bars}>
            {ZONE_KEYS.map((z, i) => {
              const pct = values[i] / maxVal;
              return (
                <View key={z} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    {/* spacer pushes bar down */}
                    <View style={{ flex: 1 - pct }} />
                    <View
                      style={[styles.barFill, { flex: pct, backgroundColor: ZONE_COLORS[i] }]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          {/* X-axis line */}
          <View style={styles.xAxisLine} />
          {/* X labels */}
          <View style={styles.xLabels}>
            {ZONE_KEYS.map(z => (
              <SafeText key={z} style={styles.xLabel}>
                {t(`workout.${z}`)}
              </SafeText>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...theme.cardStyles.default,
    gap: theme.spacing.sm,
  },
  heading: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: {
    fontSize: 9,
    color: theme.colors.text.muted,
    lineHeight: 12,
  },
  barsWrapper: {
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
    alignItems: 'flex-end',
  },
  barCol: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 1,
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  xAxisLine: {
    height: 1,
    backgroundColor: theme.colors.text.muted,
    opacity: 0.3,
  },
  xLabels: {
    flexDirection: 'row',
    marginTop: 4,
  },
  xLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
});
