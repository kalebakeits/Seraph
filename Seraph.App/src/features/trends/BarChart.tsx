/* eslint-disable @typescript-eslint/no-deprecated -- runOnJS: scheduleOnRN crashes, pending worklets upgrade */
import React, { useState, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, Line, vec } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import type { TrendPoint, TrendSummary } from './useTrendData';

const CHART_HEIGHT = 200;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 32;
const BAR_RADIUS = 3;
const Y_AXIS_WIDTH = 0;
const GRID_COLOR = 'rgba(255,255,255,0.08)';
const GRID_FRACS = [0.25, 0.5, 0.75, 1.0];

export interface BarChartProps {
  points: TrendPoint[];
  color: string;
  unit: string;
  format: (v: number) => string;
  summary: TrendSummary | null;
}

export const BarChart: React.FC<BarChartProps> = ({ points, color, unit, format, summary }) => {
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setCanvasWidth(e.nativeEvent.layout.width);
  }, []);

  const plotWidth = canvasWidth - Y_AXIS_WIDTH;
  const chartHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slotWidth = points.length > 0 ? plotWidth / points.length : 0;
  const barWidth = points.length > 0 ? Math.max(4, slotWidth * 0.3) : 0;
  const canvasHeight = CHART_HEIGHT - PADDING_BOTTOM;

  const maxVal = points.length > 0 ? Math.max(...points.map(p => p.value)) : 1;

  const toY = useCallback(
    (v: number) => PADDING_TOP + chartHeight - (v / maxVal) * chartHeight,
    [chartHeight, maxVal],
  );

  const barCenterX = useCallback(
    (i: number) => Y_AXIS_WIDTH + slotWidth * i + slotWidth / 2,
    [slotWidth],
  );

  const xToIndex = useCallback(
    (x: number) => {
      if (slotWidth === 0) return 0;
      return Math.max(0, Math.min(points.length - 1, Math.floor((x - Y_AXIS_WIDTH) / slotWidth)));
    },
    [slotWidth, points.length],
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

  const avgY = summary?.avg != null ? toY(summary.avg) : null;
  const focused = focusedIndex !== null ? points[focusedIndex] : null;
  const focusX = focusedIndex !== null ? barCenterX(focusedIndex) : 0;
  const tooltipLeft =
    focusedIndex !== null ? Math.max(Y_AXIS_WIDTH, Math.min(focusX - 40, canvasWidth - 88)) : 0;

  return (
    <View style={styles.chartArea} onLayout={onLayout}>
      {/* Tooltip */}
      {focused != null && (
        <View style={[styles.tooltip, { left: tooltipLeft }]}>
          <SafeText style={styles.tooltipDate}>
            {focused.weekday ?? focused.label} {focused.day ?? ''}
          </SafeText>
          <SafeText style={[styles.tooltipValue, { color }]}>
            {format(focused.value)}
            {unit}
          </SafeText>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
          {GRID_FRACS.map(frac => {
            const y = toY(maxVal * frac);
            return (
              <Line
                p1={vec(Y_AXIS_WIDTH, y)}
                p2={vec(canvasWidth, y)}
                color={GRID_COLOR}
                strokeWidth={1}
              />
            );
          })}

          {avgY !== null && (
            <Line
              p1={vec(Y_AXIS_WIDTH, avgY)}
              p2={vec(canvasWidth, avgY)}
              color={color}
              strokeWidth={1}
              opacity={0.4}
            />
          )}

          {points.map((p, i) => {
            const cx = barCenterX(i);
            const y = toY(p.value);
            const h = PADDING_TOP + chartHeight - y;
            if (h <= 0) return null;
            const isFocused = focusedIndex === i;
            return (
              <RoundedRect
                key={p.date}
                x={cx - barWidth / 2}
                y={y}
                width={barWidth}
                height={h}
                r={BAR_RADIUS}
                color={color}
                opacity={isFocused || focusedIndex === null ? 0.9 : 0.3}
              />
            );
          })}
        </Canvas>
      </GestureDetector>

      <View style={styles.xAxisRow}>
        {points.map((p, i) => (
          <View
            key={p.date}
            style={{
              position: 'absolute',
              left: barCenterX(i) - 22,
              width: 44,
              alignItems: 'center',
            }}
          >
            <SafeText style={styles.axisWeekday}>{p.weekday ?? p.label}</SafeText>
            {p.day != null && <SafeText style={styles.axisDay}>{p.day}</SafeText>}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartArea: {
    position: 'relative',
    width: '100%',
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: Y_AXIS_WIDTH - 4,
    fontSize: 9,
    color: theme.colors.text.muted,
    textAlign: 'right',
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    backgroundColor: 'rgba(20,10,40,0.94)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 80,
  },
  tooltipDate: {
    fontSize: 9,
    color: theme.colors.text.muted,
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
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
});
