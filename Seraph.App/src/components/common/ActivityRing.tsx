import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { theme } from '../../theme';
import { SafeText } from './SafeText';

interface ActivityRingProps {
  value: number | null; // Current value, null = no data
  goal: number; // Goal value
  size: number; // Diameter of the ring
  strokeWidth: number;
  color: string;
  label: string;
  unit?: string;
  decimals?: number;
  compact?: boolean; // Compact mode: no value text, smaller label beside ring
  targetLow?: number; // Optional target range low (same scale as value/goal)
  targetHigh?: number; // Optional target range high
  onPress?: () => void;
}

export const ActivityRing: React.FC<ActivityRingProps> = ({
  value,
  goal,
  size,
  strokeWidth,
  color,
  label,
  unit = '',
  decimals,
  compact = false,
  targetLow,
  targetHigh,
  onPress,
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  // Calculate progress (can exceed 100%)
  const progress = value !== null ? Math.min(value / goal, 2) : 0;
  const progressAngle = progress * 360;

  const createArc = (startAngle: number, endAngle: number) => {
    const path = Skia.Path.Make();
    path.addArc(
      {
        x: center - radius,
        y: center - radius,
        width: radius * 2,
        height: radius * 2,
      },
      startAngle - 90,
      endAngle - startAngle,
    );
    return path;
  };

  const backgroundPath = createArc(0, 360);
  const progressPath = createArc(0, progressAngle);

  const targetMarkerPath =
    targetLow !== undefined && targetHigh !== undefined
      ? (() => {
          const mid = (targetLow + targetHigh) / 2 / goal;
          const angleDeg = mid * 360 - 90; // -90 to start from top
          const angleRad = (angleDeg * Math.PI) / 180;
          const inner = radius - strokeWidth / 2;
          const outer = radius + strokeWidth / 2;
          const path = Skia.Path.Make();
          path.moveTo(center + inner * Math.cos(angleRad), center + inner * Math.sin(angleRad));
          path.lineTo(center + outer * Math.cos(angleRad), center + outer * Math.sin(angleRad));
          return path;
        })()
      : null;

  let displayValue = '--';
  if (value !== null) {
    displayValue = decimals !== undefined ? value.toFixed(decimals) : value.toString();
  }

  if (compact) {
    const ringElement = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={[styles.ringContainer, { width: size, height: size }]}>
          <Canvas style={{ width: size, height: size }}>
            <Path
              path={backgroundPath}
              color={theme.colors.overlay.light}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
            />
            <Path
              path={progressPath}
              color={color}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
            />
            {targetMarkerPath && (
              <Path
                path={targetMarkerPath}
                color="white"
                style="stroke"
                strokeWidth={2.5}
                strokeCap="butt"
              />
            )}
          </Canvas>
        </View>
        <SafeText style={[styles.label, { marginTop: 0 }]}>{label}</SafeText>
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {ringElement}
        </TouchableOpacity>
      );
    }
    return ringElement;
  }

  const content = (
    <View style={styles.container}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <Canvas style={{ width: size, height: size }}>
          {/* Background ring */}
          <Path
            path={backgroundPath}
            color={theme.colors.overlay.light}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
          />
          {/* Progress ring */}
          <Path
            path={progressPath}
            color={color}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
          />
          {/* Target marker — white tick, always on top */}
          {targetMarkerPath && (
            <Path
              path={targetMarkerPath}
              color="white"
              style="stroke"
              strokeWidth={2.5}
              strokeCap="butt"
            />
          )}
        </Canvas>

        <View style={[styles.centerContent, { width: size }]}>
          <SafeText style={styles.value}>
            {displayValue}
            {value !== null && unit ? unit : null}
          </SafeText>
        </View>
      </View>

      <SafeText style={styles.label}>
        {`${label} `}
        {onPress && '›'}
      </SafeText>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
