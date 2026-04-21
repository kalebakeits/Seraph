import React, { useState, useCallback, useMemo } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Canvas, RoundedRect, Line, vec } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { useStrainHistory } from '../hooks/useStrainHistory';
import { formatMinutes } from '../../../utils/dateUtils';

const CHART_HEIGHT = 160;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 32;
const BAR_RADIUS = 3;
const MAX_STRAIN = 21;

interface Props {
  anchorDate?: string;
}

export const StrainBars: React.FC<Props> = ({ anchorDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const { data: days = [] } = useStrainHistory(anchorDate);
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
    (v: number) => PADDING_TOP + chartHeight - (Math.min(v, MAX_STRAIN) / MAX_STRAIN) * chartHeight,
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

  return (
    <>
      {focused?.strain != null && (
        <View
          style={[
            styles.tooltip,
            { left: Math.max(0, Math.min(focusX - 52, chartAreaWidth - 112)) },
          ]}
        >
          <SafeText style={styles.tooltipDate}>
            {focused.weekday} {focused.day}
          </SafeText>
          <SafeText style={[styles.tooltipStrain, { color: theme.colors.strain }]}>
            {focused.strain.toFixed(1)}
          </SafeText>
          <View style={styles.tooltipFactors}>
            <SafeText style={styles.tooltipFactor}>
              {t('strain.zonesLow')} {formatMinutes(focused.lowZoneMin)}
            </SafeText>
            <SafeText style={styles.tooltipFactor}>
              {t('strain.zonesHigh')} {formatMinutes(focused.highZoneMin)}
            </SafeText>
          </View>
        </View>
      )}

      <View style={styles.chartArea} onLayout={onLayout}>
        {chartAreaWidth > 0 &&
          days.map((d, i) => {
            if (d.strain === null) return null;
            return (
              <SafeText
                key={d.date}
                style={[styles.scoreLabel, { left: barCenterX(i) - 14, top: toY(d.strain) - 18 }]}
              >
                {d.strain.toFixed(1)}
              </SafeText>
            );
          })}

        <GestureDetector gesture={panGesture}>
          <Canvas style={{ width: chartAreaWidth, height: canvasHeight }}>
            {[7, 14, 21].map(v => (
              <Line
                key={v}
                p1={vec(0, toY(v))}
                p2={vec(chartAreaWidth, toY(v))}
                color={theme.colors.overlay.faint}
                strokeWidth={1}
              />
            ))}
            {days.map((d, i) => {
              if (d.strain === null) return null;
              const cx = barCenterX(i);
              const y = toY(d.strain);
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
                  color={theme.colors.strain}
                  opacity={isFocused || focusedIndex === null ? 1 : 0.4}
                />
              );
            })}
          </Canvas>
        </GestureDetector>

        <View style={styles.xAxisRow}>
          {days.map((d, i) => (
            <View
              key={d.date}
              style={{
                position: 'absolute',
                left: barCenterX(i) - 22,
                width: theme.layout.chartLabelWidth,
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

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    chartArea: {
      position: 'relative',
    },
    scoreLabel: {
      position: 'absolute',
      fontSize: 10,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.secondary,
      width: 28,
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
      backgroundColor: theme.colors.surface.tooltipDark,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.smx,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      minWidth: 104,
    },
    tooltipDate: {
      fontSize: 9,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.xxs,
    },
    tooltipStrain: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.bold,
      marginBottom: theme.spacing.xs,
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
}
