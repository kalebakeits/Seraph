import React, { useState, useMemo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { TimePicker } from '../../components/TimePicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { PageContainer } from './PageContainer';
import { SegmentPicker } from './SegmentPicker';
import { buildStyles } from './OnboardingStyles';
import { dateFromISO, isoFromDate } from '../../utils/dateUtils';
import type { ProfileDraft, Sex } from './OnboardingTypes';

const DEFAULT_DOB_AGE_YEARS = 30;
const MIN_DOB_AGE_YEARS = 120;

interface Props {
  width: number;
  draft: ProfileDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProfileDraft>>;
}

export const ProfilePage: React.FC<Props> = ({ width, draft, setDraft }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  const set = (k: keyof ProfileDraft, v: unknown) => {
    setDraft(p => ({ ...p, [k]: v }));
  };

  const sleepGoalDate = new Date();
  sleepGoalDate.setHours(
    Math.floor(draft.sleep_goal_minutes / 60),
    draft.sleep_goal_minutes % 60,
    0,
    0,
  );

  const today = new Date();
  const defaultDobDate = new Date();
  defaultDobDate.setFullYear(today.getFullYear() - DEFAULT_DOB_AGE_YEARS);
  const minDobDate = new Date();
  minDobDate.setFullYear(today.getFullYear() - MIN_DOB_AGE_YEARS);
  const dobDate = draft.dob ? dateFromISO(draft.dob) : defaultDobDate;
  const dobDisplay = draft.dob
    ? dobDate.toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const sleepDisplay = `${String(Math.floor(draft.sleep_goal_minutes / 60)).padStart(
    2,
    '0',
  )}:${String(draft.sleep_goal_minutes % 60).padStart(2, '0')}`;

  return (
    <PageContainer width={width} scrollable>
      <SafeText style={styles.pageTitle}>{t('onboarding.profile.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.profile.subtitle')}</SafeText>
      <SafeText style={styles.privacyNote}>{t('onboarding.profile.privacy')}</SafeText>

      <View style={styles.fieldGroup}>
        <SafeText style={styles.fieldLabel}>{t('onboarding.profile.name')}</SafeText>
        <TextInput
          style={styles.input}
          value={draft.name}
          onChangeText={v => {
            set('name', v);
          }}
          placeholder={t('onboarding.profile.namePlaceholder')}
          placeholderTextColor={theme.colors.text.muted}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldGroup}>
        <SafeText style={styles.fieldLabel}>{t('onboarding.profile.dob')}</SafeText>
        <TouchableOpacity
          style={styles.pickerRow}
          onPress={() => {
            setShowDobPicker(true);
          }}
          activeOpacity={0.7}
        >
          <SafeText style={[styles.pickerValue, !draft.dob && { color: theme.colors.text.muted }]}>
            {dobDisplay || t('onboarding.profile.dobPlaceholder')}
          </SafeText>
          <Ionicons name="calendar-outline" size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldGroup}>
        <SafeText style={styles.fieldLabel}>{t('onboarding.profile.sex')}</SafeText>
        <SegmentPicker
          options={[
            { label: t('onboarding.profile.male'), value: 'male' as Sex },
            { label: t('onboarding.profile.female'), value: 'female' as Sex },
          ]}
          value={draft.sex}
          onChange={v => {
            set('sex', v);
          }}
        />
      </View>

      <View style={styles.twoCol}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <SafeText style={styles.fieldLabel}>{t('onboarding.profile.height')}</SafeText>
          <TextInput
            style={styles.input}
            value={draft.height_cm}
            onChangeText={v => {
              set('height_cm', v);
            }}
            placeholder={t('onboarding.profile.heightPlaceholder')}
            placeholderTextColor={theme.colors.text.muted}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <SafeText style={styles.fieldLabel}>{t('onboarding.profile.weight')}</SafeText>
          <TextInput
            style={styles.input}
            value={draft.weight_kg}
            onChangeText={v => {
              set('weight_kg', v);
            }}
            placeholder={t('onboarding.profile.weightPlaceholder')}
            placeholderTextColor={theme.colors.text.muted}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <SafeText style={styles.fieldLabel}>{t('onboarding.profile.sleepGoal')}</SafeText>
        <TouchableOpacity
          style={styles.pickerRow}
          onPress={() => {
            setShowSleepPicker(true);
          }}
          activeOpacity={0.7}
        >
          <SafeText style={styles.pickerValue}>{sleepDisplay}</SafeText>
          <Ionicons name="time-outline" size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldGroup}>
        <SafeText style={styles.fieldLabel}>{t('onboarding.profile.fthr')}</SafeText>
        <TextInput
          style={styles.input}
          value={draft.fthr}
          onChangeText={v => {
            set('fthr', v);
          }}
          placeholder={t('onboarding.profile.fthrPlaceholder')}
          placeholderTextColor={theme.colors.text.muted}
          keyboardType="numeric"
        />
        <SafeText style={styles.fieldHint}>{t('onboarding.profile.fthrHint')}</SafeText>
      </View>

      <TimePicker
        time={sleepGoalDate}
        onTimeChange={() => {
          /* empty */
        }}
        open={showSleepPicker}
        onCancel={() => {
          setShowSleepPicker(false);
        }}
        onConfirm={(date: Date) => {
          set('sleep_goal_minutes', date.getHours() * 60 + date.getMinutes());
          setShowSleepPicker(false);
        }}
      />

      <DatePicker
        modal
        mode="date"
        date={dobDate}
        minimumDate={minDobDate}
        maximumDate={today}
        open={showDobPicker}
        onConfirm={date => {
          set('dob', isoFromDate(date));
          setShowDobPicker(false);
        }}
        onCancel={() => {
          setShowDobPicker(false);
        }}
      />
    </PageContainer>
  );
};
