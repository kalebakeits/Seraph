/* eslint-disable @typescript-eslint/no-deprecated -- runOnJS: scheduleOnRN crashes, pending worklets upgrade */
import React, { useState, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Canvas, RoundedRect, Line, vec } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';
import type { RecoveryDay } from '../hooks/useRecoveryHistory';
import { formatDuration } from '../../../utils/dateUtils';

const ZONE_RED = 33;
const ZONE_YELLOW = 66;
const MAX_VALUE = 100;

const COLOR_RED = '#ff3b30';
const COLOR_YELLOW = '#ffd60a';
const COLOR_GREEN = '#30d158';

const CHART_PADDING = 4;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 32;
const BAR_RADIUS = 3;
const GRID_COLOR = 'rgba(255,255,255,0.12)';

function barColor(value: number): string {
  if (value < ZONE_RED) return COLOR_RED;
  if (value < ZONE_YELLOW) return COLOR_YELLOW;
  return COLOR_GREEN;
}

interface Props {
  data: RecoveryDay[];
  height?: number;
}

export const RecoveryBars: React.FC<Props> = ({ data, height = 220 }) => {
  const { t } = useTranslation();
  const [chartAreaWidth, setChartAreaWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setChartAreaWidth(e.nativeEvent.layout.width);
  }, []);

  const drawWidth = chartAreaWidth - CHART_PADDING * 2;
  const chartHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const barWidth = data.length > 0 ? Math.max(4, (drawWidth / data.length) * 0.3) : 0;
  const slotWidth = data.length > 0 ? drawWidth / data.length : 0;
  const canvasHeight = height - PADDING_BOTTOM;

  const toY = useCallback(
    (v: number) => PADDING_TOP + chartHeight - (v / MAX_VALUE) * chartHeight,
    [chartHeight],
  );

  const barCenterX = useCallback(
    (i: number) => CHART_PADDING + slotWidth * i + slotWidth / 2,
    [slotWidth],
  );

  const xToIndex = useCallback(
    (x: number) => {
      if (slotWidth === 0) return 0;
      return Math.max(0, Math.min(data.length - 1, Math.floor((x - CHART_PADDING) / slotWidth)));
    },
    [slotWidth, data.length],
  );

  const updateFocus = useCallback(
    (x: number) => {
      setFocusedIndex(xToIndex(x));
    },
    [xToIndex],
  );
  const clearFocus = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  const panGesture = Gesture.Pan()
    .onBegin(e => {
      runOnJS(updateFocus)(e.x);
    })
    .onUpdate(e => {
      runOnJS(updateFocus)(e.x);
    })
    .onEnd(() => {
      runOnJS(clearFocus)();
    })
    .onFinalize(() => {
      runOnJS(clearFocus)();
    })
    .minDistance(0);

  const focused = focusedIndex !== null ? data[focusedIndex] : null;
  const focusX = focusedIndex !== null ? barCenterX(focusedIndex) : 0;
  const tooltipLeft =
    focusedIndex !== null ? Math.max(0, Math.min(focusX - 52, chartAreaWidth - 112)) : 0;

  return (
    <>
      {focused?.recovery != null && (
        <View style={[styles.tooltip, { left: tooltipLeft }]}>
          <SafeText style={styles.tooltipDate}>
            {focused.weekday} {focused.day}
          </SafeText>
          <SafeText style={[styles.tooltipScore, { color: barColor(focused.recovery) }]}>
            {focused.recovery}%
          </SafeText>
          <View style={styles.tooltipFactors}>
            {focused.hrv !== null && (
              <SafeText style={styles.tooltipFactor}>
                {t('sleep.hrv')} {focused.hrv} {t('common.ms')}
              </SafeText>
            )}
            {focused.rhr !== null && (
              <SafeText style={styles.tooltipFactor}>
                {t('sleep.rhr')} {focused.rhr} {t('common.bpm')}
              </SafeText>
            )}
            {focused.sleepMin !== null && (
              <SafeText style={styles.tooltipFactor}>
                {t('home.sleep')} {formatDuration(focused.sleepMin * 60_000)}
              </SafeText>
            )}
          </View>
        </View>
      )}

      <View style={styles.chartArea} onLayout={onLayout}>
        {chartAreaWidth > 0 &&
          data.map((d, i) => {
            if (d.recovery === null) return null;
            return (
              <SafeText
                key={d.date}
                style={[
                  styles.scoreLabel,
                  {
                    left: barCenterX(i) - 16,
                    top: toY(d.recovery) - 18,
                    color: barColor(d.recovery),
                  },
                ]}
              >
                {d.recovery}%
              </SafeText>
            );
          })}

        <GestureDetector gesture={panGesture}>
          <Canvas style={{ width: chartAreaWidth, height: canvasHeight }}>
            {[ZONE_RED, ZONE_YELLOW].map(z => (
              <Line
                key={z}
                p1={vec(CHART_PADDING, toY(z))}
                p2={vec(chartAreaWidth - CHART_PADDING, toY(z))}
                color={GRID_COLOR}
                strokeWidth={1}
              />
            ))}

            {data.map((d, i) => {
              if (d.recovery === null) return null;
              const cx = barCenterX(i);
              const y = toY(d.recovery);
              const h = PADDING_TOP + chartHeight - y;
              const isFocused = focusedIndex === i;
              return (
                <RoundedRect
                  key={d.date}
                  x={cx - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={h}
                  r={BAR_RADIUS}
                  color={barColor(d.recovery)}
                  opacity={isFocused || focusedIndex === null ? 1 : 0.4}
                />
              );
            })}
          </Canvas>
        </GestureDetector>

        <View style={styles.xAxisRow}>
          {data.map((d, i) => (
            <View
              key={d.date}
              style={{
                position: 'absolute',
                left: barCenterX(i) - 22,
                width: 44,
                alignItems: 'center',
              }}
            >
              <SafeText style={styles.axisWeekday}>{d.weekday}</SafeText>
              <SafeText style={styles.axisDay}>{d.day}</SafeText>
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  chartArea: {
    position: 'relative',
  },
  scoreLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
    width: 32,
    textAlign: 'center',
    zIndex: 1,
  },
  xAxisRow: {
    height: PADDING_BOTTOM,
    position: 'relative',
  },
  axisWeekday: {
    color: theme.colors.text.muted,
    fontSize: 9,
    lineHeight: 12,
  },
  axisDay: {
    color: theme.colors.text.tertiary,
    fontSize: 9,
    lineHeight: 12,
  },
  tooltip: {
    position: 'absolute',
    top: 28,
    zIndex: 10,
    backgroundColor: 'rgba(20,10,40,0.94)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 104,
  },
  tooltipDate: {
    fontSize: 9,
    color: theme.colors.text.muted,
    marginBottom: 2,
  },
  tooltipScore: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 4,
  },
  tooltipFactors: {
    width: '100%',
    gap: 1,
  },
  tooltipFactor: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
