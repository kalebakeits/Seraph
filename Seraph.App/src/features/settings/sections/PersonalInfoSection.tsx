import React, { useMemo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { useTheme, type Theme } from '../../../theme';
import type { Sex } from '../SettingsTypes';

export interface PersonalInfoState {
  name: string;
  dob: string;
  sex: Sex;
  height_cm: string;
  weight_kg: string;
  sleep_goal_minutes: number;
  fthr: string;
}

interface Props {
  state: PersonalInfoState;
  dobDisplay: string;
  sleepDisplay: string;
  onFieldChange: <K extends keyof PersonalInfoState>(key: K, value: PersonalInfoState[K]) => void;
  onFieldChangeImmediate: <K extends keyof PersonalInfoState>(
    key: K,
    value: PersonalInfoState[K],
  ) => void;
  onShowCalendar: () => void;
  onShowTimePicker: () => void;
}

export const PersonalInfoSection: React.FC<Props> = ({
  state,
  dobDisplay,
  sleepDisplay,
  onFieldChange,
  onFieldChangeImmediate,
  onShowCalendar,
  onShowTimePicker,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <>
      <SafeText style={sectionStyles.sectionTitle}>{t('settings.personalInfo')}</SafeText>
      <View style={sectionStyles.container}>
        <View style={styles.row}>
          <SafeText style={styles.rowLabel}>{t('settings.name')}</SafeText>
          <TextInput
            style={styles.rowInput}
            value={state.name}
            onChangeText={v => {
              onFieldChange('name', v);
            }}
            placeholder={t('settings.namePlaceholder')}
            placeholderTextColor={theme.colors.text.muted}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <SafeText style={styles.rowLabel}>{t('settings.dob')}</SafeText>
          <TouchableOpacity onPress={onShowCalendar} activeOpacity={0.7} style={styles.rowRight}>
            <SafeText style={[styles.rowValue, !state.dob && { color: theme.colors.text.muted }]}>
              {dobDisplay}
            </SafeText>
            <Ionicons name="calendar-outline" size={15} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <SafeText style={styles.rowLabel}>{t('settings.sex')}</SafeText>
          <View style={styles.rowRight}>
            {(['male', 'female'] as Sex[]).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, state.sex === s && styles.chipActive]}
                onPress={() => {
                  onFieldChangeImmediate('sex', s);
                }}
                activeOpacity={0.7}
              >
                <SafeText style={[styles.chipText, state.sex === s && styles.chipTextActive]}>
                  {t(`settings.${s}`)}
                </SafeText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.twoRow}>
          <View style={styles.halfRow}>
            <SafeText style={styles.rowLabel}>{t('settings.height')}</SafeText>
            <TextInput
              style={styles.rowInput}
              value={state.height_cm}
              onChangeText={v => {
                onFieldChange('height_cm', v);
              }}
              placeholder={t('settings.heightPlaceholder')}
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          <View style={styles.twoRowDivider} />
          <View style={styles.halfRow}>
            <SafeText style={styles.rowLabel}>{t('settings.weight')}</SafeText>
            <TextInput
              style={styles.rowInput}
              value={state.weight_kg}
              onChangeText={v => {
                onFieldChange('weight_kg', v);
              }}
              placeholder={t('settings.weightPlaceholder')}
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <SafeText style={styles.rowLabel}>{t('settings.sleepGoal')}</SafeText>
          <TouchableOpacity onPress={onShowTimePicker} activeOpacity={0.7} style={styles.rowRight}>
            <SafeText style={styles.rowValue}>{sleepDisplay}</SafeText>
            <Ionicons name="time-outline" size={15} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <SafeText style={styles.rowLabel}>{t('settings.fthr')}</SafeText>
          <TextInput
            style={[styles.rowInput, { textAlign: 'right' }]}
            value={state.fthr}
            onChangeText={v => {
              onFieldChange('fthr', v);
            }}
            placeholder={t('settings.fthrPlaceholder')}
            placeholderTextColor={theme.colors.text.muted}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>
        <SafeText style={styles.hint}>{t('settings.fthrHint')}</SafeText>
      </View>
    </>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm + 2,
      minHeight: 44,
    },
    rowLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      flex: 1,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    rowValue: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.primary,
    },
    rowInput: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'right',
      paddingVertical: 0,
    },
    twoRow: {
      flexDirection: 'row',
    },
    halfRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm + 2,
      minHeight: 44,
    },
    twoRowDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.overlay.faint,
      marginHorizontal: theme.spacing.sm,
      alignSelf: 'stretch',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.overlay.faint,
    },
    chip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.overlay.medium,
      backgroundColor: theme.colors.overlay.dim,
      marginLeft: 6,
    },
    chipActive: {
      borderColor: theme.colors.strain,
      backgroundColor: theme.colors.strain + '22',
    },
    chipText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.secondary,
    },
    chipTextActive: {
      color: theme.colors.strain,
      fontWeight: theme.typography.weights.semibold,
    },
    hint: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      lineHeight: 18,
      paddingHorizontal: theme.spacing.xxs,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
  });
}
