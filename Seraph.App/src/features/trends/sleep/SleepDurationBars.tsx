import React, { useState, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Canvas, RoundedRect, Rect, Line, vec } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';
import { formatDuration } from '../../../utils/dateUtils';
import { useSleepWeekData } from './useSleepWeekData';

const CHART_HEIGHT = 160;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 32;
const BAR_RADIUS = 3;
const MAX_HOURS = 12;
const MAX_MINUTES = MAX_HOURS * 60;
const GRID_COLOR = 'rgba(255,255,255,0.08)';
const SLEEP_COLOR = theme.colors.sleep;
const AWAKE_COLOR = 'rgba(255,255,255,0.18)';

interface Props {
  anchorDate?: string;
}

export const SleepDurationBars: React.FC<Props> = ({ anchorDate }) => {
  const { t } = useTranslation();
  const { data: days = [] } = useSleepWeekData(anchorDate);
  const [chartAreaWidth, setChartAreaWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setChartAreaWidth(e.nativeEvent.layout.width);
  }, []);

  const chartHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slotWidth = days.length > 0 ? chartAreaWidth / days.length : 0;
  const barWidth = Math.max(4, slotWidth * 0.35);
  const canvasHeight = CHART_HEIGHT - PADDING_BOTTOM;

  const toY = useCallback(
    (minutes: number) =>
      PADDING_TOP + chartHeight - (Math.min(minutes, MAX_MINUTES) / MAX_MINUTES) * chartHeight,
    [chartHeight],
  );

  const barCenterX = useCallback((i: number) => slotWidth * i + slotWidth / 2, [slotWidth]);

  const xToIndex = useCallback(
    (x: number) => {
      if (slotWidth === 0) return 0;
      return Math.max(0, Math.min(days.length - 1, Math.floor(x / slotWidth)));
    },
    [slotWidth, days.length],
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

  const focused = focusedIndex !== null ? days[focusedIndex] : null;
  const focusX = focusedIndex !== null ? barCenterX(focusedIndex) : 0;

  const gridHours = [4, 8, 12];

  return (
    <>
      {focused && focused.sleepMinutes > 0 && (
        <View
          style={[
            styles.tooltip,
            { left: Math.max(0, Math.min(focusX - 52, chartAreaWidth - 112)) },
          ]}
        >
          <SafeText style={styles.tooltipDate}>
            {focused.weekday} {focused.day}
          </SafeText>
          <SafeText style={[styles.tooltipValue, { color: SLEEP_COLOR }]}>
            {formatDuration(focused.sleepMinutes * 60_000)}
          </SafeText>
          {focused.awakeMinutes > 0 && (
            <SafeText style={styles.tooltipAwake}>
              {t('sleep.awake')} {formatDuration(focused.awakeMinutes * 60_000)}
            </SafeText>
          )}
        </View>
      )}

      <View style={styles.chartArea} onLayout={onLayout}>
        {chartAreaWidth > 0 && (
          <GestureDetector gesture={panGesture}>
            <Canvas style={{ width: chartAreaWidth, height: canvasHeight }}>
              {gridHours.map(h => (
                <Line
                  key={h}
                  p1={vec(0, toY(h * 60))}
                  p2={vec(chartAreaWidth, toY(h * 60))}
                  color={GRID_COLOR}
                  strokeWidth={1}
                />
              ))}
              {days.map((d, i) => {
                if (d.sleepMinutes === 0) return null;
                const cx = barCenterX(i);
                const totalMinutes = d.sleepMinutes + d.awakeMinutes;
                const sleepY = toY(d.sleepMinutes);
                const totalY = toY(totalMinutes);
                const sleepH = PADDING_TOP + chartHeight - sleepY;
                const awakeH = sleepY - totalY;
                const isFocused = focusedIndex === i;
                const opacity = isFocused || focusedIndex === null ? 1 : 0.4;
                return (
                  <React.Fragment key={d.date}>
                    <RoundedRect
                      x={cx - barWidth / 2}
                      y={sleepY}
                      width={barWidth}
                      height={sleepH}
                      r={BAR_RADIUS}
                      color={SLEEP_COLOR}
                      opacity={opacity}
                    />
                    {awakeH > 0 && (
                      <Rect
                        x={cx - barWidth / 2}
                        y={totalY}
                        width={barWidth}
                        height={awakeH}
                        color={AWAKE_COLOR}
                        opacity={opacity}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </Canvas>
          </GestureDetector>
        )}

        <View style={styles.xAxisRow}>
          {days.map((d, i) => (
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
  tooltipValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 2,
  },
  tooltipAwake: {
    fontSize: 9,
    color: theme.colors.text.secondary,
  },
});
