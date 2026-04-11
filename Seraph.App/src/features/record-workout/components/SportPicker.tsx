import React from 'react';
import { Modal, View, TouchableOpacity, Pressable, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';
import { SPORT_LABELS } from '../../../types/ActivityType';

interface SportPickerProps {
  visible: boolean;
  selected: string;
  recentSports: string[];
  onSelect: (sport: string) => void;
  onClose: () => void;
}

export const SportPicker: React.FC<SportPickerProps> = ({
  visible,
  selected,
  recentSports,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();

  type Section = { type: 'header'; title: string } | { type: 'item'; label: string };

  const sections: Section[] = [];

  if (recentSports.length > 0) {
    sections.push({ type: 'header', title: t('workout.recentSports') });
    for (const s of recentSports) sections.push({ type: 'item', label: s });
  }

  sections.push({ type: 'header', title: t('workout.allSports') });
  for (const s of SPORT_LABELS) sections.push({ type: 'item', label: s });

  const renderItem = ({ item }: { item: Section }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <SafeText style={styles.sectionTitle}>{item.title}</SafeText>
        </View>
      );
    }
    const isSelected = item.label === selected;
    return (
      <TouchableOpacity
        style={[styles.sportRow, isSelected && styles.sportRowSelected]}
        activeOpacity={0.7}
        onPress={() => {
          onSelect(item.label);
          onClose();
        }}
      >
        <SafeText style={[styles.sportLabel, isSelected && { color: theme.colors.strain }]}>
          {item.label}
        </SafeText>
        {isSelected && <Ionicons name="checkmark" size={18} color={theme.colors.strain} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={e => {
            e.stopPropagation();
          }}
        >
          <View style={styles.header}>
            <SafeText style={styles.title}>{t('workout.sportPicker')}</SafeText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-outline" size={22} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={sections}
            keyExtractor={(item, idx) => (item.type === 'header' ? `h-${String(idx)}` : item.label)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
          />
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.surface.sheet,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  sectionHeader: {
    paddingVertical: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  sportRowSelected: {
    // no extra background, icon + color is enough
  },
  sportLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
  },
});
