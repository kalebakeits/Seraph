import React, { useMemo, useState, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Line,
  vec,
  Circle,
  DashPathEffect,
  Rect,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { SafeText } from './SafeText';
import { useTheme, type Theme } from '../../theme';

export interface ChartPoint {
  value: number;
  label?: string;
}

interface ReferenceLine {
  value: number;
  color: string;
  dashWidth?: number;
  dashGap?: number;
  label?: string;
}

interface HighlightBand {
  from: number;
  to: number;
  color: string;
  opacity?: number;
}

interface SkiaLineChartProps {
  data: ChartPoint[];
  height?: number;
  color: string;
  areaChart?: boolean;
  referenceLine?: ReferenceLine;
  highlightBand?: HighlightBand;
  yLabelSuffix?: string;
  formatYLabel?: (v: number) => string;
  noOfSections?: number;
  minValue?: number;
  maxValue?: number;
}

const Y_AXIS_WIDTH = 0;
const X_AXIS_HEIGHT = 20;
const PADDING_TOP = 12;
const PADDING_RIGHT = 0;

export const SkiaLineChart: React.FC<SkiaLineChartProps> = ({
  data,
  height = 220,
  color,
  areaChart = false,
  referenceLine,
  highlightBand,
  yLabelSuffix = '',
  formatYLabel,
  noOfSections = 4,
  minValue: minValueProp,
  maxValue: maxValueProp,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartWidth = containerWidth - Y_AXIS_WIDTH - PADDING_RIGHT;
  const chartHeight = height - X_AXIS_HEIGHT - PADDING_TOP;

  const { yMin, yMax, yTicks } = useMemo(() => {
    if (data.length === 0) {
      const step = 100 / noOfSections;
      return {
        yMin: 0,
        yMax: 100,
        yTicks: Array.from({ length: noOfSections + 1 }, (_, i) => i * step),
      };
    }

    const values = data.map(d => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const pad = Math.max(1, (dataMax - dataMin) * 0.1);
    const yMin = minValueProp ?? Math.max(0, Math.floor(dataMin - pad));
    const yMax = maxValueProp ?? Math.ceil(dataMax + pad);

    const step = (yMax - yMin) / noOfSections;
    const yTicks: number[] = [];
    for (let i = 0; i <= noOfSections; i++) {
      yTicks.push(yMin + step * i);
    }
    return { yMin, yMax, yTicks };
  }, [data, noOfSections, minValueProp, maxValueProp]);

  const toX = useCallback(
    (i: number) => {
      if (data.length <= 1) return Y_AXIS_WIDTH;
      return Y_AXIS_WIDTH + (i / (data.length - 1)) * chartWidth;
    },
    [data.length, chartWidth],
  );

  const toY = useCallback(
    (v: number) => {
      const range = yMax - yMin;
      if (range === 0) return PADDING_TOP + chartHeight / 2;
      return PADDING_TOP + chartHeight - ((v - yMin) / range) * chartHeight;
    },
    [yMin, yMax, chartHeight],
  );

  const { linePath, areaPath } = useMemo(() => {
    if (data.length === 0 || chartWidth <= 0) return { linePath: null, areaPath: null };

    const line = Skia.Path.Make();
    const area = Skia.Path.Make();

    const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

    line.moveTo(points[0].x, points[0].y);
    area.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      line.lineTo(points[i].x, points[i].y);
      area.lineTo(points[i].x, points[i].y);
    }

    const bottom = PADDING_TOP + chartHeight;
    area.lineTo(points[points.length - 1].x, bottom);
    area.lineTo(points[0].x, bottom);
    area.close();

    return { linePath: line, areaPath: area };
  }, [data, chartWidth, chartHeight, toX, toY]);

  const xToIndex = useCallback(
    (x: number) => {
      if (data.length <= 1) return 0;
      const ratio = (x - Y_AXIS_WIDTH) / chartWidth;
      return Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    },
    [data.length, chartWidth],
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

  const fmt = formatYLabel ?? ((v: number) => Math.round(v).toString());

  // X-axis labels: first, middle, last
  const xLabels = useMemo(() => {
    if (data.length === 0) return [];
    const all = data
      .map((d, i) => (d.label ? { index: i, label: d.label, x: toX(i) } : null))
      .filter((l): l is { index: number; label: string; x: number } => l !== null);
    if (all.length <= 3) return all;
    const mid = Math.floor(all.length / 2);
    return [all[0], all[mid], all[all.length - 1]];
  }, [data, toX]);

  const canvasHeight = height - X_AXIS_HEIGHT;
  const focused = focusedIndex !== null ? data[focusedIndex] : null;
  const focusX = focusedIndex !== null ? toX(focusedIndex) : 0;
  const focusY = focusedIndex !== null ? toY(data[focusedIndex].value) : 0;

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {/* Tooltip */}
      {focused && (
        <View style={[styles.tooltip, { left: Math.min(focusX - 40, containerWidth - 90) }]}>
          {focused.label ? <SafeText style={styles.tooltipLabel}>{focused.label}</SafeText> : null}
          <SafeText style={[styles.tooltipValue, { color }]}>
            {fmt(focused.value)}
            {yLabelSuffix}
          </SafeText>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <View>
          <Canvas style={{ width: containerWidth, height: canvasHeight }}>
            {/* Grid lines */}
            {yTicks.map(tick => (
              <Line
                key={tick}
                p1={vec(Y_AXIS_WIDTH, toY(tick))}
                p2={vec(containerWidth - PADDING_RIGHT, toY(tick))}
                color={theme.colors.overlay.dim}
                strokeWidth={1}
              />
            ))}

            {/* Highlight band */}
            {highlightBand && (
              <>
                <Rect
                  x={Y_AXIS_WIDTH}
                  y={toY(highlightBand.to)}
                  width={chartWidth}
                  height={toY(highlightBand.from) - toY(highlightBand.to)}
                  color={highlightBand.color}
                  opacity={highlightBand.opacity ?? 0.1}
                />
                <Path
                  path={(() => {
                    const p = Skia.Path.Make();
                    p.moveTo(Y_AXIS_WIDTH, toY(highlightBand.to));
                    p.lineTo(containerWidth - PADDING_RIGHT, toY(highlightBand.to));
                    return p;
                  })()}
                  color={highlightBand.color}
                  style="stroke"
                  strokeWidth={1}
                  opacity={0.4}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Path>
                <Path
                  path={(() => {
                    const p = Skia.Path.Make();
                    p.moveTo(Y_AXIS_WIDTH, toY(highlightBand.from));
                    p.lineTo(containerWidth - PADDING_RIGHT, toY(highlightBand.from));
                    return p;
                  })()}
                  color={highlightBand.color}
                  style="stroke"
                  strokeWidth={1}
                  opacity={0.4}
                >
                  <DashPathEffect intervals={[4, 4]} />
                </Path>
              </>
            )}

            {/* Reference line */}
            {referenceLine && (
              <Path
                path={(() => {
                  const p = Skia.Path.Make();
                  const y = toY(referenceLine.value);
                  p.moveTo(Y_AXIS_WIDTH, y);
                  p.lineTo(containerWidth - PADDING_RIGHT, y);
                  return p;
                })()}
                color={referenceLine.color}
                style="stroke"
                strokeWidth={1}
                opacity={0.5}
              >
                <DashPathEffect
                  intervals={[referenceLine.dashWidth ?? 4, referenceLine.dashGap ?? 4]}
                />
              </Path>
            )}

            {/* Area fill */}
            {areaChart && areaPath && (
              <Path path={areaPath} color={color} style="fill" opacity={0.15} />
            )}

            {/* Line */}
            {linePath && (
              <Path
                path={linePath}
                color={color}
                style="stroke"
                strokeWidth={2}
                strokeCap="round"
                strokeJoin="round"
              />
            )}

            {/* Data points */}
            {data.map((d, i) => (
              <Circle key={d.label} cx={toX(i)} cy={toY(d.value)} r={3} color={color} />
            ))}

            {/* Focus indicator */}
            {focusedIndex !== null && (
              <>
                <Line
                  p1={vec(focusX, PADDING_TOP)}
                  p2={vec(focusX, PADDING_TOP + chartHeight)}
                  color={theme.colors.border.default}
                  strokeWidth={1}
                />
                <Circle cx={focusX} cy={focusY} r={5} color={color} />
                <Circle cx={focusX} cy={focusY} r={3} color="white" />
              </>
            )}
          </Canvas>

          {/* X-axis labels */}
          <View style={styles.xAxisRow}>
            {xLabels.map((l, i) => {
              const labelW = 50;
              const isFirst = i === 0;
              const isLast = i === xLabels.length - 1;
              let left: number;
              if (isFirst) left = Y_AXIS_WIDTH;
              else if (isLast) left = containerWidth - PADDING_RIGHT - labelW;
              else left = l.x - labelW / 2;
              let textAlign: 'left' | 'right' | 'center';
              if (isFirst) textAlign = 'left';
              else if (isLast) textAlign = 'right';
              else textAlign = 'center';
              return (
                <SafeText
                  key={l.label}
                  style={[
                    styles.axisText,
                    {
                      position: 'absolute',
                      left,
                      width: labelW,
                      textAlign,
                    },
                  ]}
                >
                  {l.label}
                </SafeText>
              );
            })}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.sm,
    },
    yLabel: {
      position: 'absolute',
      left: 0,
      width: Y_AXIS_WIDTH - 4,
      alignItems: 'flex-end',
      zIndex: 1,
    },
    axisText: {
      color: theme.colors.text.muted,
      fontSize: 10,
    },
    xAxisRow: {
      height: X_AXIS_HEIGHT,
      position: 'relative',
    },
    tooltip: {
      position: 'absolute',
      top: -4,
      zIndex: 10,
      backgroundColor: theme.colors.surface.tooltipDeep,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    },
    tooltipLabel: {
      fontSize: 9,
      color: theme.colors.text.muted,
    },
    tooltipValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
    },
  });
}
