import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../tokens';
import { typography } from '../typography';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  name: string;
  detail?: string;
  icon?: IoniconName;
  onPress?: () => void;
  isLast?: boolean;
}

export function DeviceDiscoveryRow({ name, detail, icon = 'phone-portrait-outline', onPress, isLast = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bgBlue }]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={[typography.body, styles.name]}>{name}</Text>
        {detail ? <Text style={[typography.caption, styles.detail]}>{detail}</Text> : null}
      </View>
      <View style={styles.action}>
        <Text style={styles.actionText}>Appairer</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </View>
      {!isLast && <View style={styles.divider} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[4],
    position: 'relative',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(44,123,229,.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  text: { flex: 1, minWidth: 0 },
  name: { color: colors.textStrong, fontWeight: '500' },
  detail: { color: colors.textMuted, marginTop: 1, fontVariantNumeric: 'tabular-nums' } as object,
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  divider: {
    position: 'absolute',
    left: 64,
    right: spacing[4],
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
