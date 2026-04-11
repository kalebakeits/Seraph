/* eslint-disable @typescript-eslint/no-deprecated -- runOnJS: scheduleOnRN crashes, pending worklets upgrade */
import React, { useState, useCallback, useMemo } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, Line, vec, Circle } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeText } from './SafeText';
import { theme } from '../../theme';

export interface DualAxisPoint {
  date: string;
  label: string;
  value: number | null;
}

export interface DualAxisSeriesConfig {
  values: (number | null)[];
  color: string;
  name: string;
  formatValue: (v: number) => string;
  scale?: { min: number; max: number };
}

export interface SkiaDualAxisChartProps {
  a: DualAxisSeriesConfig;
  b: DualAxisSeriesConfig;
  xLabels: string[];
  height?: number;
}

const PADDING_TOP = 12;
const LABEL_AREA = 18;
const EFFECTIVE_PADDING_TOP = PADDING_TOP + LABEL_AREA;
const PADDING_BOTTOM = 28;
const PADDING_H = 16;
const DOT_R = 3;
const DOT_R_FOCUSED = 4;
const GRID_COLOR = 'rgba(255,255,255,0.06)';
const NO_OF_SECTIONS = 4;
// Distance from dot centre to nearest edge of the label
const LABEL_GAP = 3;
const LABEL_HEIGHT = 11;

function autoScale(values: (number | null)[]): { min: number; max: number } {
  const vals = values.filter((v): v is number => v !== null);
  if (vals.length === 0) return { min: 0, max: 100 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = Math.max(1, (max - min) * 0.2);
  return { min: min - pad, max: max + pad };
}

function normalise(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / range));
}

export const SkiaDualAxisChart: React.FC<SkiaDualAxisChartProps> = ({
  a,
  b,
  xLabels,
  height = 220,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartWidth = containerWidth - PADDING_H * 2;
  const chartHeight = height - EFFECTIVE_PADDING_TOP - PADDING_BOTTOM;
  const canvasHeight = height - PADDING_BOTTOM;
  const n = xLabels.length;

  const scaleA = useMemo(() => a.scale ?? autoScale(a.values), [a.scale, a.values]);
  const scaleB = useMemo(() => b.scale ?? autoScale(b.values), [b.scale, b.values]);

  const toX = useCallback(
    (i: number) => {
      if (n <= 1) return PADDING_H + chartWidth / 2;
      return PADDING_H + (i / (n - 1)) * chartWidth;
    },
    [n, chartWidth],
  );

  const toY = useCallback(
    (norm: number) => EFFECTIVE_PADDING_TOP + chartHeight - norm * chartHeight,
    [chartHeight],
  );

  const xToIndex = useCallback(
    (x: number) => {
      if (n <= 1) return 0;
      return Math.max(0, Math.min(n - 1, Math.round(((x - PADDING_H) / chartWidth) * (n - 1))));
    },
    [n, chartWidth],
  );

  const buildPath = useCallback(
    (values: (number | null)[], scale: { min: number; max: number }) => {
      if (containerWidth <= 0) return null;
      const pts = values
        .map((v, i) =>
          v !== null ? { x: toX(i), y: toY(normalise(v, scale.min, scale.max)) } : null,
        )
        .filter((p): p is { x: number; y: number } => p !== null);
      if (pts.length === 0) return null;
      const path = Skia.Path.Make();
      path.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);
      return path;
    },
    [containerWidth, toX, toY],
  );

  const pathA = useMemo(() => buildPath(a.values, scaleA), [buildPath, a.values, scaleA]);
  const pathB = useMemo(() => buildPath(b.values, scaleB), [buildPath, b.values, scaleB]);

  const gridYs = useMemo(
    () => Array.from({ length: NO_OF_SECTIONS + 1 }, (_, i) => toY(i / NO_OF_SECTIONS)),
    [toY],
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

  const focusX = focusedIndex !== null ? toX(focusedIndex) : 0;

  // X-axis: first, mid, last
  const xAxisLabels = useMemo(() => {
    if (n === 0) return [];
    const mid = Math.floor(n / 2);
    return [
      { i: 0, label: xLabels[0] },
      { i: mid, label: xLabels[mid] },
      { i: n - 1, label: xLabels[n - 1] },
    ];
  }, [n, xLabels]);

  const hasAnyData = a.values.some(v => v !== null) || b.values.some(v => v !== null);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Legend */}
      <View style={styles.legend}>
        {[a, b].map(s => (
          <View key={s.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <SafeText style={styles.legendLabel}>{s.name}</SafeText>
          </View>
        ))}
      </View>

      {!hasAnyData && (
        <View style={[styles.empty, { height }]}>
          <SafeText style={styles.emptyText}>No data yet</SafeText>
        </View>
      )}

      {hasAnyData && containerWidth > 0 && (
        <GestureDetector gesture={panGesture}>
          <View>
            {/* Point value labels overlay */}
            <View style={[styles.labelOverlay, { width: containerWidth, height: canvasHeight }]}>
              {xLabels.map((_, i) => {
                const vA = a.values[i] ?? null;
                const vB = b.values[i] ?? null;
                if (vA === null && vB === null) return null;

                const normA = vA !== null ? normalise(vA, scaleA.min, scaleA.max) : null;
                const normB = vB !== null ? normalise(vB, scaleB.min, scaleB.max) : null;

                // Whichever has the higher norm (higher on screen) gets label above its dot
                const aOnTop = normA !== null && normB !== null ? normA >= normB : normA !== null;

                const cx = toX(i);
                const isFocused = focusedIndex === i;
                const opacity = isFocused || focusedIndex === null ? 1 : 0.3;

                return (
                  <React.Fragment key={`label-${String(i)}`}>
                    {vA !== null && normA !== null && (
                      <SafeText
                        style={[
                          styles.pointLabel,
                          {
                            color: a.color,
                            opacity,
                            top: aOnTop
                              ? toY(normA) - DOT_R - LABEL_GAP - LABEL_HEIGHT
                              : toY(normA) + DOT_R + LABEL_GAP,
                            left: cx - 24,
                            width: 48,
                          },
                        ]}
                      >
                        {a.formatValue(vA)}
                      </SafeText>
                    )}
                    {vB !== null && normB !== null && (
                      <SafeText
                        style={[
                          styles.pointLabel,
                          {
                            color: b.color,
                            opacity,
                            top: aOnTop
                              ? toY(normB) + DOT_R + LABEL_GAP
                              : toY(normB) - DOT_R - LABEL_GAP - LABEL_HEIGHT,
                            left: cx - 24,
                            width: 48,
                          },
                        ]}
                      >
                        {b.formatValue(vB)}
                      </SafeText>
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            <Canvas style={{ width: containerWidth, height: canvasHeight }}>
              {/* Grid */}
              {gridYs.map(y => (
                <Line
                  key={y}
                  p1={vec(PADDING_H, y)}
                  p2={vec(containerWidth - PADDING_H, y)}
                  color={GRID_COLOR}
                  strokeWidth={1}
                />
              ))}

              {/* Series A line */}
              {pathA && (
                <Path
                  path={pathA}
                  color={a.color}
                  style="stroke"
                  strokeWidth={1.5}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}

              {/* Series B line */}
              {pathB && (
                <Path
                  path={pathB}
                  color={b.color}
                  style="stroke"
                  strokeWidth={1.5}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}

              {/* Series A dots */}
              {a.values.map((v, i) => {
                if (v === null) return null;
                const cx = toX(i);
                const cy = toY(normalise(v, scaleA.min, scaleA.max));
                const isFocused = focusedIndex === i;
                return (
                  <React.Fragment key={`a-${String(i)}`}>
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={isFocused ? DOT_R_FOCUSED : DOT_R}
                      color={a.color}
                      opacity={isFocused || focusedIndex === null ? 1 : 0.3}
                    />
                    <Circle cx={cx} cy={cy} r={1.5} color="white" opacity={0.6} />
                  </React.Fragment>
                );
              })}

              {/* Series B dots */}
              {b.values.map((v, i) => {
                if (v === null) return null;
                const cx = toX(i);
                const cy = toY(normalise(v, scaleB.min, scaleB.max));
                const isFocused = focusedIndex === i;
                return (
                  <React.Fragment key={`b-${String(i)}`}>
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={isFocused ? DOT_R_FOCUSED : DOT_R}
                      color={b.color}
                      opacity={isFocused || focusedIndex === null ? 1 : 0.3}
                    />
                    <Circle cx={cx} cy={cy} r={1.5} color="white" opacity={0.6} />
                  </React.Fragment>
                );
              })}

              {/* Focus line */}
              {focusedIndex !== null && (
                <Line
                  p1={vec(focusX, EFFECTIVE_PADDING_TOP)}
                  p2={vec(focusX, EFFECTIVE_PADDING_TOP + chartHeight)}
                  color="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
              )}
            </Canvas>

            {/* X-axis */}
            <View style={styles.xAxisRow}>
              {xAxisLabels.map(({ i, label }, idx) => {
                const x = toX(i);
                const labelW = 50;
                const isFirst = idx === 0;
                const isLast = idx === xAxisLabels.length - 1;
                let left: number;
                if (isFirst) left = PADDING_H;
                else if (isLast) left = x - labelW;
                else left = x - labelW / 2;
                let textAlign: 'left' | 'right' | 'center';
                if (isFirst) textAlign = 'left';
                else if (isLast) textAlign = 'right';
                else textAlign = 'center';
                return (
                  <SafeText
                    key={label}
                    style={[
                      styles.xLabel,
                      { position: 'absolute', left, width: labelW, textAlign },
                    ]}
                  >
                    {label}
                  </SafeText>
                );
              })}
            </View>
          </View>
        </GestureDetector>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: theme.spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
  },
  labelOverlay: {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
  },
  pointLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
  },
  xAxisRow: {
    height: PADDING_BOTTOM,
    position: 'relative',
  },
  xLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
});
