import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, ListRow, ListSection,
} from '../../../design-system';

const SECTIONS = [
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Stockage local uniquement',
    text: 'Toutes vos analyses et données personnelles sont stockées exclusivement sur votre appareil. Nous ne téléchargeons ni ne stockons vos données de santé dans le cloud.',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Traitement des PDFs',
    text: "Lorsque vous téléversez un PDF pour analyse, il est envoyé à l'API Mistral pour en extraire les valeurs biologiques. Ce traitement est temporaire et aucune donnée n'est conservée par Mistral.",
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'Chiffrement SQLite',
    text: "Votre base de données locale est chiffrée via SQLCipher. Vos données restent protégées même si quelqu'un accède physiquement à votre appareil.",
  },
  {
    icon: 'key-outline' as const,
    title: 'Sécurité de la clé API',
    text: "Votre clé API Mistral est stockée dans le trousseau sécurisé de votre système d'exploitation (Secure Enclave sur iOS, Keystore sur Android).",
  },
];

export function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader title="Confidentialité" subtitle="Protection de vos données" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.infoCard}>
            <Text style={[typography.small, { fontWeight: '700', color: colors.textStrong, marginBottom: 4 }]}>
              {s.title}
            </Text>
            <Text style={[typography.small, { color: colors.textBody, lineHeight: 19 }]}>
              {s.text}
            </Text>
          </View>
        ))}

        <ListSection title="Documents">
          <ListRow
            icon="document-outline"
            title="Politique de confidentialité"
            onPress={() => router.push('/settings/privacy-policy')}
            isLast
          />
        </ListSection>

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing[4] }]}>
          Cette application n&apos;est pas un dispositif médical. Les informations sont à titre indicatif uniquement.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[3] },
  infoCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: spacing[4],
    ...elevation[1],
  },
});
