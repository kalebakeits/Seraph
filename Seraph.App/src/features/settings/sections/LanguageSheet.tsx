import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { LANGUAGES } from '../SettingsTypes';

interface Props {
  visible: boolean;
  currentCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export const LanguageSheet: React.FC<Props> = ({ visible, currentCode, onSelect, onClose }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <SafeText style={styles.title}>{t('settings.language')}</SafeText>
          {LANGUAGES.map(lang => {
            const active = currentCode === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={styles.langRow}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(lang.code);
                }}
              >
                <SafeText
                  style={[
                    styles.langLabel,
                    active && {
                      color: theme.colors.primary,
                      fontWeight: theme.typography.weights.semibold,
                    },
                  ]}
                >
                  {lang.label}
                </SafeText>
                {active && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.scrim.medium,
    },
    sheet: {
      backgroundColor: theme.colors.surface.sheet,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.xs,
    },
    title: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.overlay.light,
    },
    langLabel: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
    },
  });
}
