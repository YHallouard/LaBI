import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
        <Text style={alert ? typography.valueAlert : typography.value}>{value}</Text>
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
    backgroundColor: colors.dangerTint,
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
