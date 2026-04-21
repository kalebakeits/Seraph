import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { buildStyles } from './OnboardingStyles';

interface Props<T extends string> {
  options: { label: string; value: T }[];
  value: T | '';
  onChange: (v: T) => void;
  color?: string;
}

export function SegmentPicker<T extends string>({ options, value, onChange, color }: Props<T>) {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const activeColor = color ?? theme.colors.primary;
  return (
    <View style={styles.segmented}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segment,
              active && { borderColor: activeColor, backgroundColor: activeColor + '22' },
            ]}
            onPress={() => {
              onChange(opt.value);
            }}
            activeOpacity={0.7}
          >
            <SafeText
              style={[
                styles.segmentText,
                active && { color: activeColor, fontWeight: theme.typography.weights.semibold },
              ]}
            >
              {opt.label}
            </SafeText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
