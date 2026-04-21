import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { buildStyles } from './OnboardingStyles';

interface Props {
  children: React.ReactNode;
  width: number;
  scrollable?: boolean;
}

export const PageContainer: React.FC<Props> = ({ children, width, scrollable }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  if (scrollable) {
    return (
      <ScrollView
        style={{ width }}
        contentContainerStyle={[styles.page, { width }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.page, { width }]}>{children}</View>;
};
