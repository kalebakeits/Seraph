import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { ThemeOptionsList } from './ThemeOptionsList';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ThemePicker: React.FC<Props> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <SafeText style={styles.title}>{t('settings.theme')}</SafeText>
          <ThemeOptionsList onSelect={onClose} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: theme.colors.scrim.dark,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.surface.sheet,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: theme.spacing.sm,
    },
  });
}
