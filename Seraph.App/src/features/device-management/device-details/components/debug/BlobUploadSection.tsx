import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeText } from '../../../../../components/common/SafeText';
import { ActionRow } from '../ActionRow';
import { theme } from '../../../../../theme';
import {
  nativeIsBlobUploadAvailable,
  nativeGetBlobUploadConfig,
  nativeSetBlobUploadConfig,
} from '../../../../../services/ble/nativeModule';
import { errorMessage } from '../../../../../utils/errorUtils';

export const BlobUploadSection: React.FC = () => {
  const [available, setAvailable] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void nativeIsBlobUploadAvailable().then(v => {
      setAvailable(v);
      if (v) {
        void nativeGetBlobUploadConfig().then(cfg => {
          if (cfg) {
            setUploadUrl(cfg.uploadUrl);
            setBearerToken(cfg.bearerToken);
          }
        });
      }
    });
  }, []);

  if (!available) return null;

  const handleSave = async () => {
    try {
      await nativeSetBlobUploadConfig(uploadUrl.trim(), bearerToken.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (e) {
      Alert.alert('Save Failed', errorMessage(e));
    }
  };

  return (
    <>
      <SafeText style={styles.sectionTitle}>Blob Upload</SafeText>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <SafeText style={styles.inputLabel}>Upload URL</SafeText>
          <TextInput
            style={styles.input}
            value={uploadUrl}
            onChangeText={setUploadUrl}
            placeholder="https://..."
            placeholderTextColor={theme.colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.inputRow}>
          <SafeText style={styles.inputLabel}>Bearer Token</SafeText>
          <TextInput
            style={styles.input}
            value={bearerToken}
            onChangeText={setBearerToken}
            placeholder="token"
            placeholderTextColor={theme.colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>
        <View style={styles.divider} />
        <ActionRow
          icon={saved ? 'checkmark-circle-outline' : 'save-outline'}
          label={saved ? 'Saved' : 'Save Config'}
          onPress={() => void handleSave()}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
  inputRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    gap: 4,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
  },
  input: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.overlay.light,
    marginLeft: 52,
  },
});
