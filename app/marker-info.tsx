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
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={typography.label}>À propos du marqueur</Text>
          <Text style={[typography.h2, { letterSpacing: -0.1 }]} numberOfLines={1}>{key}</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} accessibilityLabel="Fermer">
          <Ionicons name="close" size={16} color={colors.textBody} />
        </Pressable>
      </View>

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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgElevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  titleBlock: {
    flex: 1,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
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
