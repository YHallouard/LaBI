import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { APP_VERSION } from '../../../utils/appConstants';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, ListRow, ListSection, HemeaWordmark, ModalGrabber,
} from '../../../design-system';

export function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ModalGrabber />
      <ScreenHeader title="À propos" subtitle="Héméa" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + version */}
        <View style={styles.logoSection}>
          <HemeaWordmark size={28} />
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing[2] }]}>
            Version {APP_VERSION}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
            Données stockées localement · SQLite chiffrée
          </Text>
        </View>

        {/* App description */}
        <View style={styles.descCard}>
          <Text style={[typography.small, { color: colors.textBody, lineHeight: 20, textAlign: 'center' }]}>
            Héméa vous permet de suivre vos analyses biologiques dans le temps.
            Importez vos bilans sanguins par PDF grâce à l&apos;OCR Mistral ou saisissez vos valeurs manuellement.
            Toutes vos données restent sur votre appareil.
          </Text>
        </View>

        {/* Links */}
        <ListSection title="Créateur">
          <ListRow
            icon="person-outline"
            title="Yann Hallouard"
            detail="LinkedIn"
            onPress={() => Linking.openURL('https://www.linkedin.com/in/yann-hallouard/')}
            isLast
          />
        </ListSection>

        <ListSection title="Technique">
          <ListRow
            icon="code-slash-outline"
            title="Expo SDK 54"
            detail="React Native"
          />
          <ListRow
            icon="server-outline"
            title="SQLite"
            detail="SQLCipher chiffré"
          />
          <ListRow
            icon="scan-outline"
            title="OCR"
            detail="Mistral AI"
            isLast
          />
        </ListSection>

        {/* Footer */}
        <Text style={[typography.caption, { color: colors.textFaint, textAlign: 'center', paddingHorizontal: spacing[4] }]}>
          © 2024-2026 Yann Hallouard · Application non-médicale
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  logoSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: 0,
  },
  descCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[4],
    ...elevation[1],
  },
});
