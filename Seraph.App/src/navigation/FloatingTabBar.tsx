import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, Pressable, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NavigationState } from '@react-navigation/native';
import { useTheme, type Theme } from '../theme';
import { SafeText } from '../components/common/SafeText';
import { ActivityActionSheet } from '../features/home/overview/sheets/ActivityActionSheet';
import { useHomeDateStore } from '../features/home/store/homeDateStore';

/** Screens where the floating tab bar should be hidden. */
const HIDE_ON_SCREENS = new Set([
  'WorkoutDetail',
  'RecordWorkout',
  'SleepSessionDetail',
  'NapActive',
  'NapSetup',
  'LogHabits',
  'ChooseHabits',
]);

function getFocusedLeafRoute(state: NavigationState): string | undefined {
  const route = state.routes[state.index];
  if (route.state) return getFocusedLeafRoute(route.state as NavigationState);
  return route.name;
}

interface TabConfig {
  route: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
}

const TAB_CONFIG: TabConfig[] = [
  { route: 'Home', icon: 'home-outline', iconActive: 'home' },
  { route: 'Insights', icon: 'sparkles-outline', iconActive: 'sparkles' },
  { route: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

const TAB_MIN_WIDTH = 60;
const TAB_ACTIVE_WIDTH = 110;

const SPRING_CONFIG = { damping: 18, stiffness: 180, mass: 0.8, useNativeDriver: false };

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const PILL_H_PAD = 8;
  const TAB_GAP = 4;
  const slideX = useRef(new Animated.Value(PILL_H_PAD)).current;
  const focusedLeaf = getFocusedLeafRoute(state);
  const hidden = focusedLeaf != null && HIDE_ON_SCREENS.has(focusedLeaf);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { selectedDate } = useHomeDateStore();
  const [pillWidth, setPillWidth] = useState(0);

  const currentTab = state.routes[state.index]?.name;
  const showPlusButton = currentTab === 'Home';

  // Per-tab animated widths (only used when showPlusButton)
  const tabWidths = useRef(
    state.routes.map(
      (_, i) => new Animated.Value(i === state.index ? TAB_ACTIVE_WIDTH : TAB_MIN_WIDTH),
    ),
  ).current;

  // Animate tab widths when active index or showPlusButton changes
  useEffect(() => {
    if (!showPlusButton) return;
    const anims = state.routes.map((_, i) =>
      Animated.spring(tabWidths[i], {
        toValue: i === state.index ? TAB_ACTIVE_WIDTH : TAB_MIN_WIDTH,
        ...SPRING_CONFIG,
      }),
    );
    Animated.parallel(anims).start();
  }, [state.index, showPlusButton, tabWidths, state.routes]);

  // Slide the highlight pill
  useEffect(() => {
    if (showPlusButton) {
      let offset = PILL_H_PAD;
      for (let i = 0; i < state.index; i++) {
        offset += TAB_MIN_WIDTH + TAB_GAP;
      }
      Animated.spring(slideX, { toValue: offset, ...SPRING_CONFIG }).start();
    } else {
      if (pillWidth === 0) return;
      const inner = pillWidth - PILL_H_PAD * 2;
      const tabW = (inner - TAB_GAP * (state.routes.length - 1)) / state.routes.length;
      const offset = PILL_H_PAD + state.index * (tabW + TAB_GAP);
      Animated.spring(slideX, { toValue: offset, ...SPRING_CONFIG }).start();
    }
  }, [state.index, showPlusButton, pillWidth, slideX, state.routes]);

  if (hidden) return null;

  const onPillLayout = (e: LayoutChangeEvent) => {
    setPillWidth(e.nativeEvent.layout.width);
  };

  const expandedTabW =
    pillWidth > 0
      ? (pillWidth - PILL_H_PAD * 2 - TAB_GAP * (state.routes.length - 1)) / state.routes.length
      : 0;

  return (
    <>
      <View style={[styles.wrapper, { bottom: insets.bottom + 12 }]}>
        <View style={[styles.row, !showPlusButton && styles.rowExpanded]}>
          <View
            style={[styles.pill, !showPlusButton && styles.pillExpanded]}
            onLayout={onPillLayout}
          >
            {/* Sliding highlight — always shown */}
            <Animated.View
              style={[
                styles.highlight,
                {
                  width: showPlusButton ? TAB_ACTIVE_WIDTH : expandedTabW,
                  left: slideX,
                },
              ]}
            />

            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label =
                typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;
              const isFocused = state.index === index;
              const cfg = TAB_CONFIG.find(c => c.route === route.name);
              type IconName = React.ComponentProps<typeof Ionicons>['name'];
              let iconName: IconName = 'ellipse-outline';
              if (cfg) iconName = isFocused ? cfg.iconActive : cfg.icon;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              if (showPlusButton) {
                return (
                  <Animated.View
                    key={route.key}
                    style={{ width: tabWidths[index], overflow: 'hidden' }}
                  >
                    <Pressable
                      onPress={onPress}
                      style={styles.tab}
                      accessibilityRole="tab"
                      accessibilityState={isFocused ? { selected: true } : {}}
                      accessibilityLabel={options.tabBarAccessibilityLabel}
                    >
                      <Ionicons
                        name={iconName}
                        size={22}
                        color={isFocused ? theme.colors.text.primary : theme.colors.text.muted}
                      />
                      {isFocused && <SafeText style={styles.label}>{label}</SafeText>}
                    </Pressable>
                  </Animated.View>
                );
              }

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabExpanded}
                  accessibilityRole="tab"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                >
                  <Ionicons
                    name={iconName}
                    size={22}
                    color={isFocused ? theme.colors.text.primary : theme.colors.text.muted}
                  />
                  {isFocused && <SafeText style={styles.label}>{label}</SafeText>}
                </Pressable>
              );
            })}
          </View>

          {showPlusButton && (
            <TouchableOpacity
              style={styles.plusBtn}
              activeOpacity={0.85}
              onPress={() => {
                setSheetOpen(true);
              }}
            >
              <Ionicons name="add" size={26} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {sheetOpen && (
        <ActivityActionSheet
          selectedDate={selectedDate}
          onClose={() => {
            setSheetOpen(false);
          }}
        />
      )}
    </>
  );
}

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 24,
      right: 24,
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm + theme.spacing.xxs,
    },
    rowExpanded: {
      alignSelf: 'stretch',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface.tabBar,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      paddingHorizontal: 8,
      paddingVertical: theme.spacing.sm,
      gap: 4,
      ...theme.shadows.lg,
    },
    pillExpanded: {
      flex: 1,
    },
    highlight: {
      position: 'absolute',
      top: 8,
      bottom: 8,
      backgroundColor: theme.colors.border.subtle,
      borderRadius: theme.borderRadius.full,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      gap: theme.spacing.smx,
      borderRadius: theme.borderRadius.full,
    },
    tabExpanded: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      gap: theme.spacing.smx,
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
    },
    label: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.tabLabel,
      fontWeight: theme.typography.weights.semibold,
    },
    plusBtn: {
      width: 68,
      height: 68,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface.tabBar,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.lg,
    },
  });
}
