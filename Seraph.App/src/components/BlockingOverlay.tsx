import React, { useMemo } from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme, type Theme } from '../theme';

interface BlockingOverlayProps {
  visible: boolean;
}

export const BlockingOverlay: React.FC<BlockingOverlayProps> = ({ visible }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      </View>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.scrim.dark,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
