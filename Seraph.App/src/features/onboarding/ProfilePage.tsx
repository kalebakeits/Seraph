import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { TimePicker } from '../../components/TimePicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import { PageContainer } from './PageContainer';
import { SegmentPicker } from './SegmentPicker';
import { styles, calStyles } from './OnboardingStyles';
import type { ProfileDraft, Sex } from './OnboardingTypes';

interface Props {
  width: number;
  draft: ProfileDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProfileDraft>>;
}

export const ProfilePage: React.FC<Props> = ({ width, draft, setDraft }) => {
  const { t, i18n } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
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

  const dobDisplay = draft.dob
    ? new Date(draft.dob + 'T12:00:00Z').toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
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
            setShowCalendar(true);
          }}
          activeOpacity={0.7}
        >
          <SafeText style={[styles.pickerValue, !draft.dob && { color: theme.colors.text.muted }]}>
            {dobDisplay || 'Select date'}
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

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCalendar(false);
        }}
      >
        <TouchableOpacity
          style={calStyles.overlay}
          activeOpacity={1}
          onPress={() => {
            setShowCalendar(false);
          }}
        >
          <View>
            <Calendar
              current={draft.dob || undefined}
              maxDate={new Date().toISOString().slice(0, 10)}
              onDayPress={(day: { dateString: string }) => {
                set('dob', day.dateString);
                setShowCalendar(false);
              }}
              markedDates={
                draft.dob
                  ? { [draft.dob]: { selected: true, selectedColor: theme.colors.primary } }
                  : {}
              }
              theme={{
                backgroundColor: theme.colors.background,
                calendarBackground: theme.colors.background,
                textSectionTitleColor: theme.colors.text.muted,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.text.primary,
                todayTextColor: theme.colors.sleep,
                dayTextColor: theme.colors.text.primary,
                textDisabledColor: theme.colors.text.muted,
                arrowColor: theme.colors.text.primary,
                monthTextColor: theme.colors.text.primary,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

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
    </PageContainer>
  );
};
