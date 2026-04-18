import React, { useMemo, useState, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, Line, vec, Circle, DashPathEffect } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { SafeText } from './SafeText';
import { useTheme, type Theme } from '../../theme';
import { formatTime } from '../../utils/dateUtils';

// FTHR-based zone boundaries (matches ActivityAggregator.kt)
const ZONE_THRESHOLDS = [0.72, 0.83, 0.94, 1.05];

function hrZoneIndex(hr: number, fthr: number | null): number {
  if (fthr === null) return -1;
  for (let i = 0; i < ZONE_THRESHOLDS.length; i++) {
    if (hr < fthr * ZONE_THRESHOLDS[i]) return i;
  }
  return 4;
}

function zoneColor(zone: number, fallback: string, theme: Theme): string {
  return zone >= 0 ? theme.colors.zones[zone] : fallback;
}

export interface HRChartPoint {
  hr: number;
  t: number;
}

interface SkiaHRChartProps {
  data: HRChartPoint[];
  fthr: number | null;
  height?: number;
  avgHr?: number | null;
  fallbackColor?: string;
}

const Y_AXIS_WIDTH = 32;
const PADDING_RIGHT = 4;
const PADDING_TOP = 8;
const X_AXIS_HEIGHT = 20;
const NUM_Y_SECTIONS = 4;

export const SkiaHRChart: React.FC<SkiaHRChartProps> = ({
  data,
  fthr,
  height = 200,
  avgHr,
  fallbackColor,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const resolvedFallbackColor = fallbackColor ?? theme.colors.strain;
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartWidth = containerWidth - Y_AXIS_WIDTH - PADDING_RIGHT;
  const chartHeight = height - X_AXIS_HEIGHT - PADDING_TOP;

  const { yMin, yMax, yTicks } = useMemo(() => {
    if (data.length === 0) return { yMin: 0, yMax: 200, yTicks: [] };
    const hrs = data.map(d => d.hr);
    const dataMin = Math.min(...hrs);
    const dataMax = Math.max(...hrs);
    const pad = Math.max(2, (dataMax - dataMin) * 0.08);
    const yMin = Math.max(0, Math.floor(dataMin - pad));
    const yMax = Math.ceil(dataMax + pad);
    const step = (yMax - yMin) / NUM_Y_SECTIONS;
    const yTicks: number[] = [];
    for (let i = 0; i <= NUM_Y_SECTIONS; i++) {
      yTicks.push(yMin + step * i);
    }
    return { yMin, yMax, yTicks };
  }, [data]);

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

  // Build one path per zone for segments + area fills
  const zonePaths = useMemo(() => {
    if (data.length < 2 || chartWidth <= 0) return null;

    const segments: { color: string; path: ReturnType<typeof Skia.Path.Make> }[] = [];
    const areaFills: { color: string; path: ReturnType<typeof Skia.Path.Make> }[] = [];
    const bottom = PADDING_TOP + chartHeight;

    for (let i = 0; i < data.length - 1; i++) {
      const x1 = toX(i);
      const y1 = toY(data[i].hr);
      const x2 = toX(i + 1);
      const y2 = toY(data[i + 1].hr);
      // Use the zone of the midpoint HR for segment color
      const midHr = (data[i].hr + data[i + 1].hr) / 2;
      const zone = hrZoneIndex(midHr, fthr);

      const c = zoneColor(zone, resolvedFallbackColor, theme);

      const seg = Skia.Path.Make();
      seg.moveTo(x1, y1);
      seg.lineTo(x2, y2);
      segments.push({ color: c, path: seg });

      const area = Skia.Path.Make();
      area.moveTo(x1, y1);
      area.lineTo(x2, y2);
      area.lineTo(x2, bottom);
      area.lineTo(x1, bottom);
      area.close();
      areaFills.push({ color: c, path: area });
    }

    return { segments, areaFills };
  }, [data, chartWidth, chartHeight, toX, toY, fthr, resolvedFallbackColor, theme]);

  // Avg HR reference line
  const avgPath = useMemo(() => {
    if (avgHr == null || chartWidth <= 0) return null;
    const p = Skia.Path.Make();
    const y = toY(avgHr);
    p.moveTo(Y_AXIS_WIDTH, y);
    p.lineTo(Y_AXIS_WIDTH + chartWidth, y);
    return p;
  }, [avgHr, chartWidth, toY]);

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

  // X-axis: first, middle, last timestamps
  const xLabels = useMemo(() => {
    if (data.length === 0) return [];
    if (data.length === 1) return [{ key: 'start', label: formatTime(data[0].t), x: toX(0) }];
    const mid = Math.floor((data.length - 1) / 2);
    return [
      { key: 'start', label: formatTime(data[0].t), x: toX(0) },
      { key: 'mid', label: formatTime(data[mid].t), x: toX(mid) },
      { key: 'end', label: formatTime(data[data.length - 1].t), x: toX(data.length - 1) },
    ];
  }, [data, toX]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <SafeText style={styles.emptyText}>No data</SafeText>
      </View>
    );
  }

  const canvasHeight = height - X_AXIS_HEIGHT;
  const focused = focusedIndex !== null ? data[focusedIndex] : null;
  const focusX = focusedIndex !== null ? toX(focusedIndex) : 0;
  const focusY = focusedIndex !== null ? toY(data[focusedIndex].hr) : 0;
  const focusZone = focused ? hrZoneIndex(focused.hr, fthr) : -1;
  const focusColor = focused
    ? zoneColor(focusZone, resolvedFallbackColor, theme)
    : theme.colors.text.primary;

  return (
    <View onLayout={onLayout}>
      {/* Tooltip */}
      {focused && (
        <View
          style={[
            styles.tooltip,
            { left: Math.min(Math.max(focusX - 40, 4), containerWidth - 90) },
          ]}
        >
          <SafeText style={[styles.tooltipValue, { color: focusColor }]}>
            {Math.round(focused.hr)} bpm
          </SafeText>
          <SafeText style={styles.tooltipTime}>{formatTime(focused.t)}</SafeText>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <View>
          {/* Y-axis labels */}
          {yTicks.map(tick => (
            <View key={tick} style={[styles.yLabel, { top: toY(tick) - 6 }]}>
              <SafeText style={styles.axisText}>{Math.round(tick)}</SafeText>
            </View>
          ))}

          <Canvas style={{ width: containerWidth, height: canvasHeight }}>
            {/* Grid lines */}
            {yTicks.map((tick, i) => (
              <Line
                key={`g${String(i)}`}
                p1={vec(Y_AXIS_WIDTH, toY(tick))}
                p2={vec(containerWidth - PADDING_RIGHT, toY(tick))}
                color={theme.colors.overlay.dim}
                strokeWidth={1}
              />
            ))}

            {/* Area fills — one trapezoid per segment, colored by zone */}
            {zonePaths?.areaFills.map((f, i) => (
              <Path
                key={`a${String(i)}`}
                path={f.path}
                color={f.color}
                style="fill"
                opacity={0.5}
              />
            ))}

            {/* Line segments — one per adjacent pair, colored by zone */}
            {zonePaths?.segments.map((s, i) => (
              <Path
                key={`s${String(i)}`}
                path={s.path}
                color={s.color}
                style="stroke"
                strokeWidth={2}
                strokeCap="round"
              />
            ))}

            {/* Avg HR dashed reference */}
            {avgPath && (
              <Path
                path={avgPath}
                color={theme.colors.overlay.stroke}
                style="stroke"
                strokeWidth={1}
              >
                <DashPathEffect intervals={[4, 4]} />
              </Path>
            )}

            {/* Focus indicator */}
            {focusedIndex !== null && (
              <>
                <Line
                  p1={vec(focusX, PADDING_TOP)}
                  p2={vec(focusX, PADDING_TOP + chartHeight)}
                  color={theme.colors.overlay.medium}
                  strokeWidth={1}
                />
                <Circle cx={focusX} cy={focusY} r={5} color={focusColor} />
                <Circle cx={focusX} cy={focusY} r={2.5} color="white" />
              </>
            )}
          </Canvas>

          {/* X-axis labels */}
          <View style={styles.xAxisRow}>
            {xLabels.map((l, i) => {
              const labelW = 60;
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
                  key={l.key}
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
      color: theme.colors.overlay.label,
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
      backgroundColor: theme.colors.surface.tooltipDeepHigh,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
    },
    tooltipValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
    },
    tooltipTime: {
      fontSize: 9,
      color: theme.colors.overlay.label,
    },
  });
}
