import React from 'react';
import { View, ScrollView } from 'react-native';
import { styles } from './OnboardingStyles';

interface Props {
  children: React.ReactNode;
  width: number;
  scrollable?: boolean;
}

export const PageContainer: React.FC<Props> = ({ children, width, scrollable }) => {
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
