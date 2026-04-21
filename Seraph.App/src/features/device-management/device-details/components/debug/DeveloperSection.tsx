import React, { useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { SafeText } from '../../../../../components/common/SafeText';
import { ActionRow } from '../ActionRow';
import { useTheme, type Theme } from '../../../../../theme';
import { appParametersRepository } from '../../../../../services/database/drizzle';
import {
  nativeExportDb,
  nativeImportDb,
  nativeRestartApp,
} from '../../../../../services/ble/nativeModule';
import { errorMessage } from '../../../../../utils/errorUtils';

export const DeveloperSection: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const handleExportDb = async () => {
    try {
      const folderPath = await nativeExportDb();
      Alert.alert('DB Exported', folderPath);
    } catch (e) {
      Alert.alert('Export Failed', errorMessage(e));
    }
  };

  const handleImportDb = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled) return;
      const files = result.assets;
      const names = files.map(f => f.name).join('\n');
      Alert.alert(
        'Import DB',
        `Copy ${String(files.length)} file(s) into the databases folder:\n\n${names}\n\nThe app must be restarted after import. All unsaved sync progress will be lost.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import & Restart',
            style: 'destructive',
            onPress: () => {
              const paths = files.map(f => f.uri.replace('file://', ''));
              const names = files.map(f => f.name);
              void nativeImportDb(paths, names)
                .then(() => {
                  Alert.alert('Import Complete', 'The app will now restart.', [
                    { text: 'OK', onPress: () => void nativeRestartApp() },
                  ]);
                })
                .catch((e: unknown) => {
                  Alert.alert('Import Failed', errorMessage(e));
                });
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Import Failed', errorMessage(e));
    }
  };

  return (
    <>
      <SafeText style={styles.sectionTitle}>Developer</SafeText>
      <View style={styles.card}>
        <ActionRow
          icon="download-outline"
          label="Export DB to Downloads"
          sublabel="Copies all databases to a timestamped folder in Downloads."
          onPress={() => void handleExportDb()}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="cloud-upload-outline"
          label="Import DB files"
          sublabel="Select one or more .db files. Each replaces the matching database."
          onPress={() => void handleImportDb()}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="refresh-circle-outline"
          label="Reset Onboarding"
          sublabel="Shows onboarding on next app launch"
          onPress={() => {
            void Promise.all([
              appParametersRepository.delete('onboarding_complete'),
              appParametersRepository.delete('onboarding_page'),
            ]).then(() => {
              Alert.alert('Done', 'Restart the app to see onboarding.');
            });
          }}
        />
      </View>
    </>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    sectionTitle: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
    },
    card: {
      ...theme.cardStyles.default,
      padding: 0,
      overflow: 'hidden',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.overlay.light,
      marginLeft: 52,
    },
  });
}
