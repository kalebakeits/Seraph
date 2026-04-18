import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, type Theme } from '../../theme';

interface Props {
  zone: 1 | 2 | 3 | 4 | 5 | null;
}

export const ZoneBar: React.FC<Props> = ({ zone }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const zoneSeconds = useRef([0, 0, 0, 0, 0]);
  const lastTickRef = useRef(Date.now());
  const [, forceRender] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (zone !== null && dt > 0 && dt < 10) {
        zoneSeconds.current[zone - 1] += dt;
      }
      forceRender(n => n + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [zone]);

  const total = zoneSeconds.current.reduce((a, b) => a + b, 0);
  const filledZones = zoneSeconds.current.filter(s => s / total >= 0.01).length;
  if (total < 10 || filledZones < 2) return null;

  return (
    <View style={styles.container}>
      {zoneSeconds.current.map((sec, i) => {
        const frac = total > 0 ? sec / total : 0;
        if (frac < 0.01) return null;
        return (
          <View
            key={'zone-bar' + String(i)}
            style={[styles.segment, { flex: frac, backgroundColor: theme.colors.zones[i] }]}
          />
        );
      })}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: theme.layout.legendDotLg,
      borderRadius: 4,
      overflow: 'hidden',
      width: '100%',
      gap: theme.spacing.xxs,
    },
    segment: {
      borderRadius: 4,
      minWidth: 4,
    },
  });
}
