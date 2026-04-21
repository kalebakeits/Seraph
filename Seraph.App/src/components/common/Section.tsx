import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buildSectionStyles } from '../../theme/shared/SectionStyles';
import { SafeText } from './SafeText';
import { useTheme, type Theme } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  onDismiss?: () => void;
  onPress?: () => void;
  onTitlePress?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<Props> = ({
  title,
  subtitle,
  onDismiss,
  onPress,
  onTitlePress,
  action,
  children,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const needsRow = !!onDismiss || !!action || !!onTitlePress;

  const titleText = onTitlePress ? (
    <TouchableOpacity onPress={onTitlePress} activeOpacity={0.7} style={styles.titlePressable}>
      <SafeText style={sectionStyles.sectionTitle}>{title}</SafeText>
      <Ionicons name="chevron-forward" size={14} color={theme.colors.text.muted} />
    </TouchableOpacity>
  ) : (
    <SafeText style={sectionStyles.sectionTitle}>{title}</SafeText>
  );

  const header = needsRow ? (
    <View style={sectionStyles.dismissableSectionHeader}>
      {titleText}
      {action}
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={theme.colors.text.muted} />
        </TouchableOpacity>
      )}
    </View>
  ) : (
    titleText
  );

  return (
    <View style={sectionStyles.section}>
      {header}
      {subtitle && <SafeText style={styles.subtitle}>{subtitle}</SafeText>}
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {children}
        </TouchableOpacity>
      ) : (
        children
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    titlePressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    subtitle: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      lineHeight: 18,
      marginBottom: theme.spacing.sm,
    },
  });
}
