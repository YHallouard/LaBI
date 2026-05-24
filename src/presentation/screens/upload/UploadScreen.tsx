import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader,
} from '../../../design-system';

export function UploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.grabber} />
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={[typography.body, { color: colors.primary }]}>Annuler</Text>
        </Pressable>
        <Text style={[typography.lead, styles.headerTitle]}>Importer</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={[typography.body, styles.subtitle]}>
          Comment souhaitez-vous ajouter votre analyse ?
        </Text>

        <Pressable
          onPress={() => router.push('/upload/ai-import')}
          style={({ pressed }) => [styles.choiceCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.choiceIcon, { backgroundColor: colors.primaryTint }]}>
            <Ionicons name="scan-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.choiceText}>
            <Text style={[typography.lead, { color: colors.textStrong }]}>Import IA (PDF)</Text>
            <Text style={[typography.small, { color: colors.textBody, marginTop: 4 }]}>
              Téléversez un PDF de bilan sanguin. L'IA Mistral extrait automatiquement les valeurs.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/upload/manual')}
          style={({ pressed }) => [styles.choiceCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.choiceIcon, { backgroundColor: colors.secondaryTint }]}>
            <Ionicons name="create-outline" size={28} color={colors.secondary} />
          </View>
          <View style={styles.choiceText}>
            <Text style={[typography.lead, { color: colors.textStrong }]}>Saisie manuelle</Text>
            <Text style={[typography.small, { color: colors.textBody, marginTop: 4 }]}>
              Entrez vos valeurs catégorie par catégorie.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  cancelBtn: { width: 70 },
  headerTitle: { color: colors.textStrong, fontWeight: '700' },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    gap: spacing[3],
  },
  subtitle: {
    color: colors.textBody,
    marginBottom: spacing[3],
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: spacing[4],
    ...elevation[2],
  },
  choiceIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { flex: 1 },
});
