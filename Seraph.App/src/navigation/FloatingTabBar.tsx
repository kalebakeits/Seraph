import React, { useRef, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NavigationState } from '@react-navigation/native';
import { theme } from '../theme';
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

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(state.index)).current;
  const focusedLeaf = getFocusedLeafRoute(state);
  const hidden = focusedLeaf != null && HIDE_ON_SCREENS.has(focusedLeaf);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { selectedDate } = useHomeDateStore();

  // Get the current top-level tab (Home, Insights, or Settings)
  const currentTab = state.routes[state.index]?.name;
  const showPlusButton = currentTab === 'Home';

  useEffect(() => {
    Animated.spring(slideX, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [state.index, slideX]);

  if (hidden) return null;

  return (
    <>
      <View style={[styles.wrapper, { bottom: insets.bottom + 12 }]}>
        <View style={styles.row}>
          <View style={styles.pill}>
            {/* Sliding highlight pill */}
            <Animated.View
              style={[
                styles.highlight,
                {
                  width: TAB_ACTIVE_WIDTH,
                  transform: [
                    {
                      translateX: slideX.interpolate({
                        inputRange: state.routes.map((_, i) => i),
                        outputRange: state.routes.map((_, i) => {
                          // offset = sum of widths of tabs before index i + gaps
                          let x = 2;
                          for (let j = 0; j < i; j++) {
                            x += (j === state.index ? TAB_ACTIVE_WIDTH : TAB_MIN_WIDTH) + 4;
                          }
                          return x;
                        }),
                      }),
                    },
                  ],
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

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={[styles.tab, { width: isFocused ? TAB_ACTIVE_WIDTH : TAB_MIN_WIDTH }]}
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
              <Ionicons name="add" size={26} color="#fff" />
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

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 0, 40, 0.88)',
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  highlight: {
    position: 'absolute',
    left: 8,
    top: 8,
    bottom: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borderRadius.full,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 6,
    borderRadius: theme.borderRadius.full,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 11,
    fontWeight: theme.typography.weights.semibold,
  },
  plusBtn: {
    width: 68,
    height: 68,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(18, 0, 40, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
});
