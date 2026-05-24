import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, radii, elevation, spacing } from '../tokens';
import { typography } from '../typography';

interface Props {
  date: string;
  label: string;
  value: string | number;
  unit: string;
  alert?: boolean;
  onPress?: () => void;
}

export function AnalysisCard({ date, label, value, unit, alert = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${value} ${unit}`}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.left}>
        <Text style={[typography.label, styles.labelText]}>{label}</Text>
        <Text style={[typography.small, styles.dateText]}>{date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={alert ? typography.valueAlert : typography.value}>{value}</Text>
        <Text style={[typography.caption, styles.unitText]}>
          {unit}{alert ? ' · hors plage' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...elevation[2],
  },
  left: {
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  labelText: {
    fontWeight: '600',
  },
  dateText: {
    fontWeight: '500',
    color: colors.textStrong,
  },
  unitText: {
    textAlign: 'right',
  },
});
