import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../tokens';
import { typography } from '../typography';

type Kind = 'success' | 'error' | 'warning' | 'info';

interface Props {
  kind?: Kind;
  children: React.ReactNode;
}

const kindStyles: Record<Kind, { bg: string; border: string; fg: string }> = {
  success: { bg: colors.successTint, border: colors.successDeep, fg: colors.successDeep },
  error: { bg: colors.dangerTint, border: colors.danger, fg: colors.danger },
  warning: { bg: colors.warningTint, border: colors.warning, fg: colors.warningDeep },
  info: { bg: colors.primaryTint, border: colors.primary, fg: colors.primary },
};

export function Banner({ kind = 'info', children }: Props) {
  const s = kindStyles[kind];
  return (
    <View style={[styles.banner, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[typography.small, { color: s.fg, lineHeight: 20 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});
