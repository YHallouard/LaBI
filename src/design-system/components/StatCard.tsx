import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { colors, radii, elevation, spacing } from '../tokens';
import { typography } from '../typography';

interface Props {
  label: string;
  value: string | number;
  unit: string;
  date?: string;
  alert?: boolean;
}

export function StatCard({ label, value, unit, date, alert = false }: Props) {
  return (
    <View style={[styles.card, alert && styles.cardAlert]}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[typography.valueSm, alert && { color: colors.danger }]}>{value}</Text>
        <Text style={[typography.caption, styles.unit]}>{unit}</Text>
      </View>
      {date ? <Text style={[typography.caption, styles.date]}>{date}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: spacing[3],
    alignItems: 'center',
    ...elevation[1],
  },
  cardAlert: {
    // Android elevation renders a native shadow that clips badly with
    // semi-transparent backgrounds, producing a grey halo. Use an opaque
    // tint on Android (dangerTint blended onto white #F8F9FA ≈ #FCECED).
    backgroundColor: Platform.OS === 'android' ? '#FCECED' : colors.dangerTint,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: 4,
  },
  unit: {
    marginBottom: 3,
  },
  date: {
    marginTop: 2,
  },
});
