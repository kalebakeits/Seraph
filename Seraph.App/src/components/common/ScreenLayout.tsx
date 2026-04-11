import React from 'react';
import type { ViewStyle, ScrollViewProps } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface ScreenLayoutProps extends ScrollViewProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Shared screen layout wrapper to keep consistent padding/top spacing across screens
 */
export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  contentContainerStyle,
  style,
  ...rest
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: theme.layout.screenPadding,
    paddingTop: 80,
    paddingBottom: theme.tabStyles.content.paddingBottom,
  },
});
