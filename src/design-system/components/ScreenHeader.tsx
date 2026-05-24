import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { typography } from '../typography';
import { HemeaWordmark } from './HemeaWordmark';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showLogo?: boolean;
}

export function ScreenHeader({ title, subtitle, right, showLogo = false }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showLogo && (
          <View style={styles.logo}>
            <HemeaWordmark size={14} color={colors.textFaint} />
          </View>
        )}
        <Text style={typography.h1}>{title}</Text>
        {subtitle ? <Text style={[typography.small, styles.subtitle]}>{subtitle}</Text> : null}
      </View>
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  left: {
    flex: 1,
  },
  logo: {
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
});
