import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../tokens';
import { typography } from '../typography';
import { HemeaWordmark } from './HemeaWordmark';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showLogo?: boolean;
  onBack?: () => void;
  /** Add safe-area top inset to the header padding (for full-screen contexts like onboarding). */
  safeArea?: boolean;
}

export function ScreenHeader({ title, subtitle, right, showLogo = false, onBack, safeArea = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, safeArea && { paddingTop: insets.top + spacing[4] }]}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
      ) : null}
      <View style={styles.left}>
        {showLogo && (
          <View style={styles.logo}>
            <HemeaWordmark size={14} color={colors.textFaint} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
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
  backBtn: {
    paddingBottom: 2,
    marginLeft: -spacing[2],
  },
  left: {
    flex: 1,
  },
  logo: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 31,
    color: colors.textStrong,
    letterSpacing: -0.56,
  },
  subtitle: {
    marginTop: 4,
  },
});
