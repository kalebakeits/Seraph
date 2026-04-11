import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../../components/common/SafeText';
import { theme } from '../../../../theme';
import { DeviceInfoSection } from './debug/DeviceInfoSection';
import { TrimSection } from './debug/TrimSection';
import { CommandsSection } from './debug/CommandsSection';
import { DeveloperSection } from './debug/DeveloperSection';
import { BlobUploadSection } from './debug/BlobUploadSection';

export interface DebugMenuProps {
  visible: boolean;
  onClose: () => void;
  clock: Date | null;
  alarm: Date | null;
  onWrist: boolean | undefined;
  lastTrim: { trimValue: number; r24Timestamp: number | null } | null | undefined;
  firmwareVersion: string | undefined;
  hardwareVersion: string | undefined;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({
  visible,
  onClose,
  clock,
  alarm,
  onWrist,
  lastTrim,
  firmwareVersion,
  hardwareVersion,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <SafeText style={styles.title}>{t('device.debug.title')}</SafeText>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <DeviceInfoSection
            clock={clock}
            alarm={alarm}
            onWrist={onWrist}
            firmwareVersion={firmwareVersion}
            hardwareVersion={hardwareVersion}
          />
          <TrimSection lastTrim={lastTrim} />
          <CommandsSection />
          <DeveloperSection />
          <BlobUploadSection />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
});
