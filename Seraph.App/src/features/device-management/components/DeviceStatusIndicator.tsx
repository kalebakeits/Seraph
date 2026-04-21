import React, { useEffect, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeviceState } from '../types/DeviceState';
import { theme } from '../../../theme';

interface DeviceStatusIndicatorProps {
  state?: DeviceState;
  style?: ViewStyle;
}

export const DeviceStatusIndicator: React.FC<DeviceStatusIndicatorProps> = ({ state, style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isBusy =
    state === DeviceState.Syncing ||
    state === DeviceState.Aggregating ||
    state === DeviceState.Connecting;

  useEffect(() => {
    if (isBusy) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isBusy, pulseAnim]);

  const getStatusColor = () => {
    switch (state) {
      case DeviceState.Connected:
        return theme.colors.success;
      case DeviceState.Connecting:
        return theme.colors.warning;
      case DeviceState.Syncing:
        return theme.colors.info;
      case DeviceState.Aggregating:
        return theme.colors.info;
      case DeviceState.Disconnected:
        return theme.colors.error;
      case undefined:
        return theme.colors.text.muted;
      default:
        return theme.colors.text.muted;
    }
  };

  const color = getStatusColor();

  const getIconName = () => {
    if (state === DeviceState.Syncing) {
      return 'cloud-download-outline';
    }
    return 'watch-outline';
  };

  const icon = (
    <Animated.View style={{ opacity: isBusy ? pulseAnim : 1 }}>
      <Ionicons name={getIconName()} size={16} color={color} />
    </Animated.View>
  );

  return <View style={[styles.container, style]}>{icon}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
});
