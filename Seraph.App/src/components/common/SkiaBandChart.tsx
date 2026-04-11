import React, { useMemo, useState, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, Line, vec, Circle, DashPathEffect } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { SafeText } from './SafeText';
import { theme } from '../../theme';

export interface BandChartPoint {
  value: number;
  upper: number;
  lower: number;
  label?: string;
}

interface SkiaBandChartProps {
  data: BandChartPoint[];
  height?: number;
  color: string;
  bandColor: string;
  yLabelSuffix?: string;
  formatYLabel?: (v: number) => string;
  noOfSections?: number;
}

const Y_AXIS_WIDTH = 28;
const PADDING_TOP = 12;
const PADDING_RIGHT = 8;

export const SkiaBandChart: React.FC<SkiaBandChartProps> = ({
  data,
  height = 160,
  color,
  bandColor,
  yLabelSuffix = '',
  formatYLabel,
  noOfSections = 4,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartWidth = containerWidth - Y_AXIS_WIDTH - PADDING_RIGHT;
  const chartHeight = height - PADDING_TOP;

  const { yMin, yMax, yTicks } = useMemo(() => {
    if (data.length === 0) {
      const step = 100 / noOfSections;
      return {
        yMin: 0,
        yMax: 100,
        yTicks: Array.from({ length: noOfSections + 1 }, (_, i) => i * step),
      };
    }

    const allValues = data.flatMap(d => [d.value, d.upper, d.lower]);
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const pad = Math.max(1, (dataMax - dataMin) * 0.1);
    const yMin = Math.max(0, Math.floor(dataMin - pad));
    const yMax = Math.ceil(dataMax + pad);

    const step = (yMax - yMin) / noOfSections;
    const yTicks: number[] = [];
    for (let i = 0; i <= noOfSections; i++) {
      yTicks.push(yMin + step * i);
    }
    return { yMin, yMax, yTicks };
  }, [data, noOfSections]);

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

  const { linePath, bandPath } = useMemo(() => {
    if (data.length === 0 || chartWidth <= 0) return { linePath: null, bandPath: null };

    const line = Skia.Path.Make();
    const band = Skia.Path.Make();

    // Band: trace upper edge forward, then lower edge backward
    band.moveTo(toX(0), toY(data[0].upper));
    for (let i = 1; i < data.length; i++) {
      band.lineTo(toX(i), toY(data[i].upper));
    }
    for (let i = data.length - 1; i >= 0; i--) {
      band.lineTo(toX(i), toY(data[i].lower));
    }
    band.close();

    // Line: the actual values
    line.moveTo(toX(0), toY(data[0].value));
    for (let i = 1; i < data.length; i++) {
      line.lineTo(toX(i), toY(data[i].value));
    }

    return { linePath: line, bandPath: band };
  }, [data, chartWidth, toX, toY]);

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

  const canvasHeight = height;
  const focused = focusedIndex !== null ? data[focusedIndex] : null;
  const focusX = focusedIndex !== null ? toX(focusedIndex) : 0;
  const focusY = focusedIndex !== null ? toY(data[focusedIndex].value) : 0;

  return (
    <View onLayout={onLayout}>
      {focused && (
        <View style={[styles.tooltip, { left: Math.min(focusX - 40, containerWidth - 90) }]}>
          {focused.label ? <SafeText style={styles.tooltipLabel}>{focused.label}</SafeText> : null}
          <SafeText style={[styles.tooltipValue, { color }]}>
            {fmt(focused.value)}
            {yLabelSuffix}
          </SafeText>
          <SafeText style={styles.tooltipBand}>
            {fmt(focused.lower)}–{fmt(focused.upper)}
          </SafeText>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <View>
          {yTicks.map(tick => (
            <View key={tick} style={[styles.yLabel, { top: toY(tick) - 6 }]}>
              <SafeText style={styles.axisText}>
                {fmt(tick)}
                {yLabelSuffix}
              </SafeText>
            </View>
          ))}

          <Canvas style={{ width: containerWidth, height: canvasHeight }}>
            {/* Grid lines */}
            {yTicks.map(tick => (
              <Line
                key={tick}
                p1={vec(Y_AXIS_WIDTH, toY(tick))}
                p2={vec(containerWidth - PADDING_RIGHT, toY(tick))}
                color="rgba(255,255,255,0.05)"
                strokeWidth={1}
              />
            ))}

            {/* Band fill */}
            {bandPath && <Path path={bandPath} color={bandColor} style="fill" opacity={0.15} />}

            {/* Band upper edge */}
            {data.length > 1 && (
              <Path
                path={(() => {
                  const p = Skia.Path.Make();
                  p.moveTo(toX(0), toY(data[0].upper));
                  for (let i = 1; i < data.length; i++) p.lineTo(toX(i), toY(data[i].upper));
                  return p;
                })()}
                color={bandColor}
                style="stroke"
                strokeWidth={1}
                opacity={0.3}
              >
                <DashPathEffect intervals={[4, 4]} />
              </Path>
            )}

            {/* Band lower edge */}
            {data.length > 1 && (
              <Path
                path={(() => {
                  const p = Skia.Path.Make();
                  p.moveTo(toX(0), toY(data[0].lower));
                  for (let i = 1; i < data.length; i++) p.lineTo(toX(i), toY(data[i].lower));
                  return p;
                })()}
                color={bandColor}
                style="stroke"
                strokeWidth={1}
                opacity={0.3}
              >
                <DashPathEffect intervals={[4, 4]} />
              </Path>
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
                  color="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                />
                <Circle cx={focusX} cy={focusY} r={5} color={color} />
                <Circle cx={focusX} cy={focusY} r={3} color="white" />
              </>
            )}
          </Canvas>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
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
  tooltip: {
    position: 'absolute',
    top: -4,
    zIndex: 10,
    backgroundColor: 'rgba(30,15,50,0.92)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tooltipLabel: {
    fontSize: 9,
    color: theme.colors.text.muted,
  },
  tooltipValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  tooltipBand: {
    fontSize: 9,
    color: theme.colors.text.muted,
  },
});
