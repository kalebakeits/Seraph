import React, { useMemo } from 'react';
import type { ViewStyle, ScrollViewProps } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { useTheme, type Theme } from '../../theme';

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
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
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

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      padding: theme.layout.screenPadding,
      paddingBottom: theme.tabStyles.content.paddingBottom,
    },
  });
}
