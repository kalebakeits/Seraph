import React from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface BlockingOverlayProps {
  visible: boolean;
}

export const BlockingOverlay: React.FC<BlockingOverlayProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
