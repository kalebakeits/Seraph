import React from 'react';
import { SkiaLineChart } from '../../components/common/SkiaLineChart';
import { BarChart } from './BarChart';
import type { TrendPoint, TrendSummary, TrendRange } from './useTrendData';

const CHART_HEIGHT = 220;

export interface TrendChartProps {
  points: TrendPoint[];
  color: string;
  unit: string;
  range: TrendRange;
  format?: (v: number) => string;
  summary?: TrendSummary | null;
  /** Override the default 1W bar chart with a richer metric-specific chart. */
  weekChart?: React.ReactNode;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  points,
  color,
  unit,
  range,
  format,
  summary,
  weekChart,
}) => {
  const fmt = format ?? ((v: number) => v.toLocaleString());
  const chartData = points.map(p => ({ value: p.value, label: p.label }));
  const avgVal = summary?.avg ?? null;

  if (range === '1W') {
    if (weekChart) return weekChart as React.ReactElement;
    return (
      <BarChart points={points} color={color} unit={unit} format={fmt} summary={summary ?? null} />
    );
  }

  return (
    <SkiaLineChart
      data={chartData}
      height={CHART_HEIGHT}
      color={color}
      areaChart
      formatYLabel={fmt}
      noOfSections={4}
      referenceLine={
        avgVal !== null ? { value: avgVal, color, label: `avg ${fmt(avgVal)}${unit}` } : undefined
      }
    />
  );
};
