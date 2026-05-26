import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LAB_VALUE_EXPLANATIONS } from '../src/config/LabConfig';
import { colors, spacing, radii, typography } from '../src/design-system';

export default function MarkerInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { key, unit, refMin: refMinStr, refMax: refMaxStr } = useLocalSearchParams<{
    key: string;
    unit?: string;
    refMin?: string;
    refMax?: string;
  }>();

  const info = LAB_VALUE_EXPLANATIONS[key ?? ''];
  const unit_ = unit ?? '';
  const refMin = refMinStr ? Number(refMinStr) : undefined;
  const refMax = refMaxStr ? Number(refMaxStr) : undefined;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <View style={styles.iconRow}>
          <View style={styles.icon}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[typography.label, { marginBottom: 2 }]}>À propos du marqueur</Text>
            <Text style={[typography.h2, { letterSpacing: -0.1 }]} numberOfLines={1}>{key}</Text>
          </View>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} accessibilityLabel="Fermer">
          <Ionicons name="close" size={16} color={colors.textBody} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {info ? (
          <Text style={[typography.body, styles.infoText]}>{info}</Text>
        ) : (
          <Text style={[typography.small, { color: colors.textBody }]}>
            Aucune information disponible pour ce marqueur.
          </Text>
        )}

        {refMin != null && refMax != null && (
          <View style={styles.rangeRow}>
            <Text style={[typography.small, { fontWeight: '600', color: colors.textBody }]}>Plage normale</Text>
            <Text style={[typography.small, { fontWeight: '700', color: colors.textStrong, fontVariant: ['tabular-nums'] }]}>
              {refMin} – {refMax} {unit_}
            </Text>
          </View>
        )}

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 12 }]}>
          Information à but pédagogique. Pour toute question médicale, consultez un professionnel.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    marginBottom: 14,
    gap: 12,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    paddingBottom: 16,
  },
  infoText: {
    color: colors.textBody,
    lineHeight: 22,
    marginBottom: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgBlue,
    borderRadius: radii.lg,
    padding: 12,
    marginTop: 4,
  },
});
