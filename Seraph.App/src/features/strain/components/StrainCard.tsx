import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { SafeText } from '../../../components/common/SafeText';
import { StatItem } from '../../../components/common/StatItem';
import { ActivityRing } from '../../../components/common/ActivityRing';
import { theme } from '../../../theme';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { useRecommendedStrain } from '../hooks/useRecommendedStrain';
import { useActivityRings } from '../../home/hooks/useActivityRings';
import { activityEventsRepository } from '../../../services/database/drizzle';
import { todayISO, formatMinutes } from '../../../utils/dateUtils';
import type { ZoneSeconds } from '../../../services/database/drizzle/schema';

interface Props {
  anchorDate?: string;
}

export const StrainCard: React.FC<Props> = ({ anchorDate }) => {
  const { t } = useTranslation();
  const date = anchorDate ?? todayISO();
  const { data: rings } = useActivityRings(anchorDate);
  const { data: recommended } = useRecommendedStrain(anchorDate);

  const { data: zones } = useQuery<{ lowMin: number; highMin: number } | null>({
    queryKey: ['strainZones', date],
    queryFn: async () => {
      const events = await activityEventsRepository.getByDate(date);
      let z1 = 0,
        z2 = 0,
        z3 = 0,
        z4 = 0,
        z5 = 0;
      for (const e of events) {
        if (!e.zone_seconds) continue;
        const z = JSON.parse(e.zone_seconds) as ZoneSeconds;
        z1 += z.z1;
        z2 += z.z2;
        z3 += z.z3;
        z4 += z.z4;
        z5 += z.z5;
      }
      const total = z1 + z2 + z3 + z4 + z5;
      if (total === 0) return null;
      return { lowMin: (z1 + z2 + z3) / 60, highMin: (z4 + z5) / 60 };
    },
    staleTime: 0,
  });

  const strain = rings?.strain.value ?? null;
  const recovery = recommended.recovery;
  const recLow = recommended.low;
  const recHigh = recommended.high;

  return (
    <View style={sectionStyles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={sectionStyles.header}>
            <Ionicons name="flash-outline" size={18} color={theme.colors.strain} />
            <SafeText style={sectionStyles.title}> {t('home.strain')}</SafeText>
          </View>
          <View style={styles.heroRow}>
            <SafeText style={styles.heroValue}>
              {`${recLow.toFixed(1)}–${recHigh.toFixed(1)}`}
            </SafeText>
          </View>
          <SafeText style={styles.heroSub}>{t('strain.recommendedStrain')}</SafeText>
        </View>
        <ActivityRing
          value={strain}
          goal={21}
          size={80}
          strokeWidth={7}
          color={theme.colors.strain}
          label=""
          decimals={1}
          targetLow={recommended.low}
          targetHigh={recommended.high}
        />
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCol}>
          <StatItem
            iconName="add-circle-outline"
            label={t('home.recovery')}
            value={recovery !== null ? `${String(recovery)}%` : '--'}
          />
        </View>
        <View style={styles.statCol}>
          <StatItem
            iconName="pulse-outline"
            label={t('strain.zonesLow')}
            value={zones != null ? formatMinutes(zones.lowMin) : '--'}
          />
        </View>
        <View style={styles.statCol}>
          <StatItem
            iconName="pulse-outline"
            label={t('strain.zonesHigh')}
            value={zones != null ? formatMinutes(zones.highMin) : '--'}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  leftCol: { flex: 1 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: theme.spacing.xs,
  },
  heroValue: {
    fontSize: theme.typography.sizes.hero,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  heroSub: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCol: { flex: 1 },
});
