import React, { useMemo } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeText } from '../../components/common/SafeText';
import { useTheme, type Theme } from '../../theme';
import { TREND_CONFIG, TREND_ORDER, type TrendKey } from './TrendConfig';

interface TrendPickerProps {
  selected: TrendKey;
  onSelect: (key: TrendKey) => void;
  onClose: () => void;
}

export const TrendPicker: React.FC<TrendPickerProps> = ({ selected, onSelect, onClose }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {TREND_ORDER.map(key => {
            const cfg = TREND_CONFIG[key];
            const color = cfg.getColor(theme);
            const tint = cfg.getTint(theme);
            const isSelected = key === selected;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.row, isSelected && { backgroundColor: tint }]}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(key);
                  onClose();
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: tint, borderColor: color }]}>
                  <Ionicons name={cfg.icon} size={16} color={color} />
                </View>
                <SafeText
                  style={[
                    styles.name,
                    isSelected && { color, fontWeight: theme.typography.weights.semibold },
                  ]}
                >
                  {t(cfg.nameKey)}
                </SafeText>
                {isSelected && <Ionicons name="checkmark" size={16} color={color} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay.dark,
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface.card,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      maxHeight: '70%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.overlay.medium,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      flex: 1,
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
    },
  });
}
