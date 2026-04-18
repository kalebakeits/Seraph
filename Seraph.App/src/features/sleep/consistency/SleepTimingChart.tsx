/* eslint-disable @typescript-eslint/no-deprecated -- runOnJS: scheduleOnRN crashes, pending worklets upgrade */
import React, { useState, useCallback, useMemo } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Canvas, RoundedRect, Line, vec } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { scoreColor } from '../../recovery/components/RecoveryScore';
import { formatDuration, formatTime } from '../../../utils/dateUtils';
import { useSleepTimingData } from '../hooks/useSleepTimingData';

const CHART_HEIGHT = 180;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 32;
const Y_AXIS_WIDTH = 30;
const BAR_RADIUS = 4;
const Y_MIN_DEFAULT = 20;
const Y_MAX_DEFAULT = 35;

function deriveYRange(nights: { bedHour: number | null; wakeHour: number | null }[]): {
  yMin: number;
  yMax: number;
  gridHours: number[];
} {
  const beds = nights.map(n => n.bedHour).filter((h): h is number => h !== null);
  const wakes = nights.map(n => n.wakeHour).filter((h): h is number => h !== null);
  if (beds.length === 0)
    return { yMin: Y_MIN_DEFAULT, yMax: Y_MAX_DEFAULT, gridHours: [21, 23, 25, 27, 29, 31, 33] };
  const rawMin = Math.min(...beds);
  const rawMax = Math.max(...wakes);
  const yMin = Math.floor(rawMin) - 1;
  const yMax = Math.ceil(rawMax) + 1;
  const gridHours: number[] = [];
  for (let h = Math.ceil(yMin / 2) * 2; h <= yMax; h += 2) gridHours.push(h);
  return { yMin, yMax, gridHours };
}

function formatHourLabel(decimalHour: number): string {
  const hour24 = Math.floor(decimalHour) % 24;
  let hour12: number;
  if (hour24 === 0) {
    hour12 = 12;
  } else if (hour24 > 12) {
    hour12 = hour24 - 12;
  } else {
    hour12 = hour24;
  }

  const period = hour24 < 12 ? 'a' : 'p';
  return `${String(hour12)}${period}`;
}

interface Props {
  anchorDate?: string;
}

export const SleepTimingChart: React.FC<Props> = ({ anchorDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  const [chartAreaWidth, setChartAreaWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const { data: nights = [] } = useSleepTimingData(anchorDate);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setChartAreaWidth(e.nativeEvent.layout.width);
  }, []);

  const { yMin, yMax, gridHours } = deriveYRange(nights);
  const chartWidth = chartAreaWidth - Y_AXIS_WIDTH;
  const chartHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slotWidth = nights.length > 0 ? chartWidth / nights.length : 0;
  const barWidth = Math.max(6, slotWidth * 0.4);
  const canvasHeight = CHART_HEIGHT - PADDING_BOTTOM;

  const toY = useCallback(
    (h: number) => {
      const clamped = Math.max(yMin, Math.min(yMax, h));
      return PADDING_TOP + ((clamped - yMin) / (yMax - yMin)) * chartHeight;
    },
    [yMin, yMax, chartHeight],
  );

  const barCenterX = useCallback((i: number) => slotWidth * i + slotWidth / 2, [slotWidth]);

  const xToIndex = useCallback(
    (x: number) => {
      if (slotWidth === 0) return 0;
      return Math.max(0, Math.min(nights.length - 1, Math.floor(x / slotWidth)));
    },
    [slotWidth, nights.length],
  );

  const updateFocus = useCallback(
    (x: number) => {
      setFocusedIndex(xToIndex(x - Y_AXIS_WIDTH));
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

  const focused = focusedIndex !== null ? nights[focusedIndex] : null;
  const focusX = focusedIndex !== null ? Y_AXIS_WIDTH + barCenterX(focusedIndex) : 0;
  const tooltipLeft =
    focusedIndex !== null ? Math.max(Y_AXIS_WIDTH, Math.min(focusX - 44, chartAreaWidth - 96)) : 0;

  return (
    <View style={sectionStyles.container}>
      <SafeText style={styles.title}>{t('sleep.sevenDaySleep')}</SafeText>

      {focused?.durationMin != null && (
        <View style={[styles.tooltip, { left: tooltipLeft }]}>
          <SafeText style={styles.tooltipLabel}>
            {focused.weekday} {focused.day}
          </SafeText>
          <SafeText style={[styles.tooltipValue, { color: theme.colors.sleep }]}>
            {formatDuration(focused.durationMin * 60_000)}
          </SafeText>
          {focused.bedTs !== null && focused.wakeTs !== null && (
            <SafeText style={styles.tooltipRange}>
              {formatTime(focused.bedTs)} – {formatTime(focused.wakeTs)}
            </SafeText>
          )}
        </View>
      )}

      <View style={styles.chartArea} onLayout={onLayout}>
        {chartAreaWidth > 0 &&
          gridHours.map(h => (
            <SafeText key={h} style={[styles.yLabel, { top: toY(h) - 6 }]}>
              {formatHourLabel(h)}
            </SafeText>
          ))}

        {chartAreaWidth > 0 &&
          nights.map((n, i) => {
            if (n.recovery === null || n.bedHour === null) return null;
            return (
              <SafeText
                key={n.date}
                style={[
                  styles.recoveryLabel,
                  {
                    left: Y_AXIS_WIDTH + barCenterX(i) - 16,
                    top: toY(n.bedHour) - 18,
                    color: scoreColor(n.recovery, theme),
                  },
                ]}
              >
                {n.recovery}%
              </SafeText>
            );
          })}

        <GestureDetector gesture={panGesture}>
          <Canvas style={{ width: chartAreaWidth, height: canvasHeight }}>
            {gridHours.map(h => (
              <Line
                key={h}
                p1={vec(Y_AXIS_WIDTH, toY(h))}
                p2={vec(chartAreaWidth, toY(h))}
                color={theme.colors.overlay.faint}
                strokeWidth={1}
              />
            ))}

            {nights.map((n, i) => {
              if (n.bedHour === null || n.wakeHour === null) return null;
              const cx = Y_AXIS_WIDTH + barCenterX(i);
              const y1 = toY(n.bedHour);
              const y2 = toY(n.wakeHour);
              const isFocused = focusedIndex === i;
              return (
                <RoundedRect
                  key={n.date}
                  x={cx - barWidth / 2}
                  y={y1}
                  width={barWidth}
                  height={Math.max(4, y2 - y1)}
                  r={BAR_RADIUS}
                  color={theme.colors.sleep}
                  opacity={isFocused || focusedIndex === null ? 1 : 0.4}
                />
              );
            })}
          </Canvas>
        </GestureDetector>

        <View style={styles.xAxisRow}>
          {nights.map((n, i) => (
            <View
              key={n.date}
              style={{
                position: 'absolute',
                left: Y_AXIS_WIDTH + barCenterX(i) - 22,
                width: theme.layout.chartLabelWidth,
                alignItems: 'center',
              }}
            >
              <SafeText style={styles.axisWeekday}>{n.weekday}</SafeText>
              <SafeText style={styles.axisDay}>{n.day}</SafeText>
            </View>
          ))}
        </View>
      </View>
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
    chartArea: {
      position: 'relative',
    },
    yLabel: {
      position: 'absolute',
      left: 0,
      width: Y_AXIS_WIDTH - 2,
      fontSize: 9,
      color: theme.colors.text.muted,
      zIndex: 1,
      textAlign: 'right',
    },
    recoveryLabel: {
      position: 'absolute',
      fontSize: 10,
      fontWeight: theme.typography.weights.semibold,
      width: theme.layout.iconSize.sm,
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
      backgroundColor: theme.colors.surface.tooltipDeep,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      minWidth: 88,
    },
    tooltipLabel: {
      fontSize: 9,
      color: theme.colors.text.muted,
    },
    tooltipValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
    },
    tooltipRange: {
      fontSize: 9,
      color: theme.colors.text.muted,
      marginTop: 1,
    },
  });
}
