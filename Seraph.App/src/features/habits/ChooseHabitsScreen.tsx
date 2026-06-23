import React, { useCallback, useRef, useState, useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useQueryClient } from '@tanstack/react-query';
import { SafeText } from '../../components/common/SafeText';
import { HabitCatalogRow } from './components/HabitCatalogRow';
import { AddCustomHabitSheet } from './AddCustomHabitSheet';
import { useAllHabits } from './hooks/useAllHabits';
import { habitDefinitionsRepository } from '../../services/database/drizzle';
import { useTheme, type Theme } from '../../theme';
import { reportError } from '../../utils/reportError';
import type { HabitDefinition } from '../../services/database/drizzle/schema';

export function ChooseHabitsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const { data: habits = [] } = useAllHabits();

  const [items, setItems] = useState<HabitDefinition[] | null>(null);
  const displayItems = items ?? habits;

  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<HabitDefinition[] | null>(null);

  const scheduleSave = useCallback(
    (snapshot: HabitDefinition[]) => {
      pendingSaveRef.current = snapshot;
      if (saveRef.current) clearTimeout(saveRef.current);
      if (savingRef.current) return;
      saveRef.current = setTimeout(() => {
        const saveSnapshot = pendingSaveRef.current;
        pendingSaveRef.current = null;
        if (!saveSnapshot) return;
        void (async () => {
          savingRef.current = true;
          try {
            for (const h of saveSnapshot) {
              await habitDefinitionsRepository.setActive(h.id, h.is_active === 1);
            }
            for (let i = 0; i < saveSnapshot.length; i++) {
              await habitDefinitionsRepository.setSortOrder(saveSnapshot[i].id, i);
            }
            void queryClient.invalidateQueries({ queryKey: ['habits'] });
          } catch (e) {
            reportError(e, 'habits', 'chooseHabitsSave');
          } finally {
            savingRef.current = false;
            const pendingSnapshot = pendingSaveRef.current;
            if (pendingSnapshot) {
              scheduleSave(pendingSnapshot);
            }
          }
        })();
      }, 400);
    },
    [queryClient],
  );

  const handleToggle = useCallback(
    (id: number, active: boolean) => {
      const next = displayItems.map(h => (h.id === id ? { ...h, is_active: active ? 1 : 0 } : h));
      setItems(next);
      scheduleSave(next);
    },
    [displayItems, scheduleSave],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: HabitDefinition[] }) => {
      setItems(data);
      scheduleSave(data);
    },
    [scheduleSave],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<HabitDefinition>) => (
      <ScaleDecorator>
        <HabitCatalogRow habit={item} onToggle={handleToggle} onDrag={drag} dragging={isActive} />
      </ScaleDecorator>
    ),
    [handleToggle],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <DraggableFlatList
        data={displayItems}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<SafeText style={styles.hint}>{t('habits.chooseHint')}</SafeText>}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addCustomBtn}
            activeOpacity={0.7}
            onPress={() => {
              setAddSheetOpen(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.recovery} />
            <SafeText style={styles.addCustomText}>{t('habits.addCustom')}</SafeText>
          </TouchableOpacity>
        }
      />
      {addSheetOpen && (
        <AddCustomHabitSheet
          onClose={() => {
            setAddSheetOpen(false);
          }}
        />
      )}
    </GestureHandlerRootView>
  );
}

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    list: {
      paddingTop: theme.layout.screenPadding,
      paddingBottom: theme.tabStyles.content.paddingBottom + 16,
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
  });
}
