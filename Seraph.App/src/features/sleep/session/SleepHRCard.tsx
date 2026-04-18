import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Rect,
  Line,
  vec,
  Circle,
  DashPathEffect,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { formatTime } from '../../../utils/dateUtils';
import type { HRChartPoint } from '../../../components/common/SkiaHRChart';

interface AwakeRun {
  from: number;
  to: number;
}

interface Props {
  hrPoints: HRChartPoint[];
  awakeRuns: AwakeRun[];
  avgHr: number | null;
}

const Y_AXIS_WIDTH = 32;
const PADDING_RIGHT = 4;
const PADDING_TOP = 8;
const X_AXIS_HEIGHT = 20;
const CHART_HEIGHT = 180;
const NUM_Y_SECTIONS = 4;

export const SleepHRCard: React.FC<Props> = ({ hrPoints, awakeRuns, avgHr }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartWidth = containerWidth - Y_AXIS_WIDTH - PADDING_RIGHT;
  const chartHeight = CHART_HEIGHT - X_AXIS_HEIGHT - PADDING_TOP;

  const { yMin, yMax, yTicks } = useMemo(() => {
    if (hrPoints.length === 0) return { yMin: 30, yMax: 100, yTicks: [] };
    const hrs = hrPoints.map(d => d.hr);
    const dataMin = Math.min(...hrs);
    const dataMax = Math.max(...hrs);
    const pad = Math.max(2, (dataMax - dataMin) * 0.08);
    const yMinV = Math.max(0, Math.floor(dataMin - pad));
    const yMaxV = Math.ceil(dataMax + pad);
    const step = (yMaxV - yMinV) / NUM_Y_SECTIONS;
    const ticks: number[] = [];
    for (let i = 0; i <= NUM_Y_SECTIONS; i++) ticks.push(yMinV + step * i);
    return { yMin: yMinV, yMax: yMaxV, yTicks: ticks };
  }, [hrPoints]);

  const tMin = hrPoints.length > 0 ? hrPoints[0].t : 0;
  const tMax = hrPoints.length > 0 ? hrPoints[hrPoints.length - 1].t : 1;
  const tRange = tMax - tMin || 1;

  const toX = useCallback(
    (t: number) => Y_AXIS_WIDTH + ((t - tMin) / tRange) * chartWidth,
    [tMin, tRange, chartWidth],
  );

  const toXByIndex = useCallback(
    (i: number) => {
      if (hrPoints.length <= 1) return Y_AXIS_WIDTH;
      return Y_AXIS_WIDTH + (i / (hrPoints.length - 1)) * chartWidth;
    },
    [hrPoints.length, chartWidth],
  );

  const toY = useCallback(
    (v: number) => {
      const range = yMax - yMin;
      if (range === 0) return PADDING_TOP + chartHeight / 2;
      return PADDING_TOP + chartHeight - ((v - yMin) / range) * chartHeight;
    },
    [yMin, yMax, chartHeight],
  );

  const linePath = useMemo(() => {
    if (hrPoints.length < 2 || chartWidth <= 0) return null;
    const p = Skia.Path.Make();
    hrPoints.forEach((pt, i) => {
      const x = toXByIndex(i);
      const y = toY(pt.hr);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    });
    return p;
  }, [hrPoints, chartWidth, toXByIndex, toY]);

  const areaPath = useMemo(() => {
    if (hrPoints.length < 2 || chartWidth <= 0) return null;
    const p = Skia.Path.Make();
    const bottom = PADDING_TOP + chartHeight;
    hrPoints.forEach((pt, i) => {
      const x = toXByIndex(i);
      const y = toY(pt.hr);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    });
    p.lineTo(toXByIndex(hrPoints.length - 1), bottom);
    p.lineTo(toXByIndex(0), bottom);
    p.close();
    return p;
  }, [hrPoints, chartWidth, chartHeight, toXByIndex, toY]);

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
      if (hrPoints.length <= 1) return 0;
      const ratio = (x - Y_AXIS_WIDTH) / chartWidth;
      return Math.max(0, Math.min(hrPoints.length - 1, Math.round(ratio * (hrPoints.length - 1))));
    },
    [hrPoints.length, chartWidth],
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

  const xLabels = useMemo(() => {
    if (hrPoints.length === 0) return [];
    const mid = Math.floor((hrPoints.length - 1) / 2);
    return [
      { key: 'start', label: formatTime(hrPoints[0].t), x: toXByIndex(0) },
      { key: 'mid', label: formatTime(hrPoints[mid].t), x: toXByIndex(mid) },
      {
        key: 'end',
        label: formatTime(hrPoints[hrPoints.length - 1].t),
        x: toXByIndex(hrPoints.length - 1),
      },
    ];
  }, [hrPoints, toXByIndex]);

  const canvasHeight = CHART_HEIGHT - X_AXIS_HEIGHT;
  const focused = focusedIndex !== null ? hrPoints[focusedIndex] : null;
  const focusX = focusedIndex !== null ? toXByIndex(focusedIndex) : 0;
  const focusY = focusedIndex !== null ? toY(hrPoints[focusedIndex].hr) : 0;

  if (hrPoints.length === 0) return null;

  return (
    <View style={styles.card}>
      <SafeText style={styles.heading}>{t('sleep.heartRate')}</SafeText>

      {focused && (
        <View
          style={[
            styles.tooltip,
            { left: Math.min(Math.max(focusX - 40, 4), containerWidth - 90) },
          ]}
        >
          <SafeText style={styles.tooltipValue}>{Math.round(focused.hr)} bpm</SafeText>
          <SafeText style={styles.tooltipTime}>{formatTime(focused.t)}</SafeText>
        </View>
      )}

      <GestureDetector gesture={panGesture}>
        <View onLayout={onLayout}>
          {yTicks.map(tick => (
            <View key={tick} style={[styles.yLabel, { top: toY(tick) - 6 }]}>
              <SafeText style={styles.axisText}>{Math.round(tick)}</SafeText>
            </View>
          ))}

          <Canvas style={{ width: containerWidth, height: canvasHeight }}>
            {yTicks.map((tick, i) => (
              <Line
                key={`g${String(i)}`}
                p1={vec(Y_AXIS_WIDTH, toY(tick))}
                p2={vec(containerWidth - PADDING_RIGHT, toY(tick))}
                color={theme.colors.overlay.dim}
                strokeWidth={1}
              />
            ))}

            {/* Awake window boxes */}
            {awakeRuns.map(run => {
              const x1 = toX(run.from);
              const x2 = toX(run.to);
              const w = Math.max(x2 - x1, 2);
              return (
                <Rect
                  key={`awake-${String(run.from)}`}
                  x={x1}
                  y={PADDING_TOP}
                  width={w}
                  height={chartHeight}
                  color={theme.colors.overlay.soft}
                />
              );
            })}

            {areaPath && (
              <Path path={areaPath} color={theme.colors.sleep} style="fill" opacity={0.15} />
            )}
            {linePath && (
              <Path
                path={linePath}
                color={theme.colors.sleep}
                style="stroke"
                strokeWidth={2}
                strokeCap="round"
              />
            )}

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

            {focusedIndex !== null && (
              <>
                <Line
                  p1={vec(focusX, PADDING_TOP)}
                  p2={vec(focusX, PADDING_TOP + chartHeight)}
                  color={theme.colors.overlay.medium}
                  strokeWidth={1}
                />
                <Circle cx={focusX} cy={focusY} r={5} color={theme.colors.sleep} />
                <Circle cx={focusX} cy={focusY} r={2.5} color="white" />
              </>
            )}
          </Canvas>

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
                    { position: 'absolute', left, width: labelW, textAlign },
                  ]}
                >
                  {l.label}
                </SafeText>
              );
            })}
          </View>
        </View>
      </GestureDetector>

      {awakeRuns.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendSwatch} />
          <SafeText style={styles.legendLabel}>{t('sleep.stageAwake')}</SafeText>
        </View>
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
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
      top: 24,
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
      color: theme.colors.sleep,
    },
    tooltipTime: {
      fontSize: 9,
      color: theme.colors.overlay.label,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.smx,
    },
    legendSwatch: {
      width: 12,
      height: 12,
      borderRadius: 2,
      backgroundColor: theme.colors.overlay.soft,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    legendLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
  });
}
