import React from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style }) => {
  return <View style={[styles.background, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
