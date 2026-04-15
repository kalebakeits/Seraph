import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { SafeText } from '../../components/common/SafeText';
import { HabitCatalogRow } from './components/HabitCatalogRow';
import { useAllHabits } from './hooks/useAllHabits';
import { habitDefinitionsRepository } from '../../services/database/drizzle';
import { theme, tabStyles } from '../../theme';

export function ChooseHabitsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { data: habits = [] } = useAllHabits();
  const [pending, setPending] = useState<Record<number, boolean>>({});

  const handleToggle = (id: number, active: boolean) => {
    setPending(prev => ({ ...prev, [id]: active }));
  };

  const handleSave = async () => {
    for (const [idStr, active] of Object.entries(pending)) {
      await habitDefinitionsRepository.setActive(Number(idStr), active);
    }
    void queryClient.invalidateQueries({ queryKey: ['habits'] });
    navigation.goBack();
  };

  const displayHabits = habits.map(h => {
    if (!(h.id in pending)) return h;
    return { ...h, is_active: pending[h.id] ? 1 : 0 };
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={displayHabits}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <HabitCatalogRow habit={item} onToggle={handleToggle} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<SafeText style={styles.hint}>{t('habits.chooseHint')}</SafeText>}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addCustomBtn}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate('AddCustomHabit' as never);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.recovery} />
            <SafeText style={styles.addCustomText}>{t('habits.addCustom')}</SafeText>
          </TouchableOpacity>
        }
      />

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => {
          void handleSave();
        }}
        activeOpacity={0.7}
      >
        <SafeText style={styles.saveBtnText}>{t('common.save')}</SafeText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingTop: 80,
    paddingBottom: tabStyles.content.paddingBottom + 64,
  },
  hint: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.muted,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  addCustomText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.recovery,
    fontWeight: theme.typography.weights.semibold,
  },
  saveBtn: {
    position: 'absolute',
    bottom: tabStyles.content.paddingBottom,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.recovery,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: '#000',
  },
});
