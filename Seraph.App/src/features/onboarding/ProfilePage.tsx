import React, { useState, useMemo } from 'react';
import { TimePicker } from '../../components/TimePicker';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { PageContainer } from './PageContainer';
import { buildStyles } from './OnboardingStyles';
import { minutesToDate } from '../../utils/dateUtils';
import { DobDatePicker } from '../profile/components/DobDatePicker';
import { PersonalInfoSection } from '../profile/sections/PersonalInfoSection';
import type { ProfileDraft } from './OnboardingTypes';

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

  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => {
    setDraft(p => ({ ...p, [k]: v }));
  };

  const sleepGoalDate = minutesToDate(draft.sleep_goal_minutes);
  const dobDisplay = draft.dob
    ? new Date(draft.dob + 'T12:00:00Z').toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : '—';

  const sleepDisplay = `${String(Math.floor(draft.sleep_goal_minutes / 60)).padStart(
    2,
    '0',
  )}:${String(draft.sleep_goal_minutes % 60).padStart(2, '0')}`;

  return (
    <PageContainer width={width} scrollable>
      <SafeText style={styles.pageTitle}>{t('onboarding.profile.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.profile.subtitle')}</SafeText>
      <SafeText style={styles.privacyNote}>{t('onboarding.profile.privacy')}</SafeText>

      <PersonalInfoSection
        state={draft}
        dobDisplay={dobDisplay}
        sleepDisplay={sleepDisplay}
        onFieldChange={set}
        onFieldChangeImmediate={set}
        onShowCalendar={() => {
          setShowDobPicker(true);
        }}
        onShowTimePicker={() => {
          setShowSleepPicker(true);
        }}
      />

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

      <DobDatePicker
        dob={draft.dob}
        open={showDobPicker}
        onConfirm={iso => {
          set('dob', iso);
          setShowDobPicker(false);
        }}
        onCancel={() => {
          setShowDobPicker(false);
        }}
      />
    </PageContainer>
  );
};
