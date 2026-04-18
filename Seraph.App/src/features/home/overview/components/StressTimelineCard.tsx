import React, { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../../components/common/SafeText';
import { Section } from '../../../../components/common/Section';
import { useTheme, type Theme } from '../../../../theme';
import { buildSectionStyles } from '../../../../theme/shared/SectionStyles';
import { useDayStress, type HRVWindow, type StressOverlay } from '../../hooks/useDayStress';

const Y_AXIS_WIDTH = 28;
const PADDING_RIGHT = 4;
const PADDING_TOP = 8;
const X_AXIS_HEIGHT = 16;

// Stress index 0-100 → colour
// 0-25: blue, 25-50: green, 50-70: yellow, 70-85: orange, 85-100: red
// activity window: grey
function stressColor(index: number, theme: Theme): string {
  if (index < 25) return theme.colors.stress.calm;
  if (index < 50) return theme.colors.stress.low;
  if (index < 70) return theme.colors.stress.mild;
  if (index < 85) return theme.colors.stress.moderate;
  return theme.colors.stress.high;
}

function stressIndex(rmssd: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return Math.round(Math.max(0, Math.min(100, ((baseline - rmssd) / baseline) * 100)));
}

function isInOverlay(slot: number, overlays: StressOverlay[]): boolean {
  return overlays.some(o => slot >= o.startSlot && slot <= o.endSlot);
}

interface Props {
  selectedDate?: string;
}

export const StressTimelineCard: React.FC<Props> = ({ selectedDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  const { data } = useDayStress(selectedDate);
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const { windows, overlays, dailyStress, baseline } = data ?? {
    windows: [],
    overlays: [],
    dailyStress: null,
    baseline: null,
  };

  const chartHeight = 80;
  const chartW = containerWidth - Y_AXIS_WIDTH - PADDING_RIGHT;
  const chartH = chartHeight - PADDING_TOP;

  const xTicks = useMemo(() => {
    if (windows.length === 0) return [];
    // 00:00, 06:00, 12:00, 18:00
    return [0, 72, 144, 216].map(slot => ({
      slot,
      label: `${String(slot / 12).padStart(2, '0')}:00`,
      x: Y_AXIS_WIDTH + (slot / 287) * chartW,
    }));
  }, [windows, chartW]);

  const paths = useMemo(() => {
    if (windows.length === 0 || chartW <= 0 || baseline === null) return [];

    const nonNullValues = windows.map(w => w.v).filter((v): v is number => v !== null);
    if (nonNullValues.length === 0) return [];

    const yMin = Math.max(0, Math.min(...nonNullValues) * 0.85);
    const yMax = Math.max(...nonNullValues) * 1.1;
    const range = yMax - yMin || 1;

    const toX = (slot: number) => Y_AXIS_WIDTH + (slot / 287) * chartW;
    const toY = (v: number) => PADDING_TOP + chartH - ((v - yMin) / range) * chartH;

    // Group consecutive windows by color into segments
    const segments: { color: string; points: { x: number; y: number }[] }[] = [];
    let current: { color: string; points: { x: number; y: number }[] } | null = null;

    for (let i = 0; i < windows.length; i++) {
      const w: HRVWindow | undefined = windows[i];
      if (w.v === null) {
        current = null;
        continue;
      }

      const inActivity = isInOverlay(i, overlays);
      const color = inActivity
        ? theme.colors.stress.activity
        : stressColor(stressIndex(w.v, baseline), theme);

      const pt = { x: toX(i), y: toY(w.v) };

      if (current !== null && current.color === color) {
        current.points.push(pt);
      } else {
        // Overlap by 1 point for seamless join
        const lastPt = current ? current.points[current.points.length - 1] : null;
        const overlap: { x: number; y: number }[] = lastPt ? [lastPt] : [];
        current = { color, points: [...overlap, pt] };
        segments.push(current);
      }
    }

    return segments
      .map(seg => {
        if (seg.points.length < 2) return null;
        const path = Skia.Path.Make();
        path.moveTo(seg.points[0].x, seg.points[0].y);
        for (let i = 1; i < seg.points.length; i++) {
          path.lineTo(seg.points[i].x, seg.points[i].y);
        }
        return { path, color: seg.color };
      })
      .filter((s): s is { path: ReturnType<typeof Skia.Path.Make>; color: string } => s !== null);
  }, [windows, overlays, baseline, chartW, chartH, theme]);

  if (windows.length === 0) return null;

  return (
    <Section title={t('stress.timeline')}>
      <View style={sectionStyles.container}>
        <View style={styles.headerRow}>
          <SafeText style={styles.label}>{t('stress.dailyStress')}</SafeText>
          {dailyStress !== null && (
            <SafeText style={[styles.score, { color: stressColor(dailyStress, theme) }]}>
              {dailyStress}
            </SafeText>
          )}
        </View>

        <View onLayout={onLayout} style={{ height: chartHeight + X_AXIS_HEIGHT }}>
          {containerWidth > 0 && (
            <Canvas style={{ width: containerWidth, height: chartHeight }}>
              {paths.map((seg, i) => (
                <Path
                  key={'stress-' + String(i)}
                  path={seg.path}
                  color={seg.color}
                  style="stroke"
                  strokeWidth={1.5}
                  strokeJoin="round"
                  strokeCap="round"
                />
              ))}
            </Canvas>
          )}
          {/* X axis labels */}
          <View style={[styles.xAxis, { width: containerWidth }]}>
            {xTicks.map(tick => (
              <SafeText
                key={tick.slot}
                style={[styles.xLabel, { position: 'absolute', left: tick.x - 16 }]}
              >
                {tick.label}
              </SafeText>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {(
            [
              ['calm', theme.colors.stress.calm],
              ['low', theme.colors.stress.low],
              ['mild', theme.colors.stress.mild],
              ['moderate', theme.colors.stress.moderate],
              ['high', theme.colors.stress.high],
            ] as [string, string][]
          ).map(([key, color]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <SafeText style={styles.legendLabel}>{t(`stress.level.${key}`)}</SafeText>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.stress.activity }]} />
            <SafeText style={styles.legendLabel}>{t('stress.level.activity')}</SafeText>
          </View>
        </View>
      </View>
    </Section>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    score: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
    },
    xAxis: {
      height: X_AXIS_HEIGHT,
      position: 'relative',
    },
    xLabel: {
      fontSize: theme.typography.sizes.tick,
      color: theme.colors.text.muted,
      width: theme.layout.iconSize.sm,
      textAlign: 'center',
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: theme.layout.legendDot,
      height: theme.layout.legendDot,
      borderRadius: 3,
    },
    legendLabel: {
      fontSize: theme.typography.sizes.tick,
      color: theme.colors.text.muted,
    },
  });
}
