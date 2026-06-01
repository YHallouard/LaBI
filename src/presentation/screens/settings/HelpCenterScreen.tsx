import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors, spacing,
  ScreenHeader, ListRow, ListSection, ModalGrabber,
} from '../../../design-system';

export function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ModalGrabber />
      <ScreenHeader title="Centre d'aide" subtitle="Questions fréquentes et support" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <ListSection title="Import et OCR">
          <ListRow
            icon="key-outline"
            title="Obtenir une clé API Mistral"
            detail="Tutoriel pas à pas"
            onPress={() => router.push('/settings/api-key-tutorial')}
          />
          <ListRow
            icon="document-text-outline"
            title="Formats PDF supportés"
            detail="Bilans biologiques standard"
            isLast
          />
        </ListSection>

        <ListSection title="Contact">
          <ListRow
            icon="mail-outline"
            title="Envoyer un e-mail"
            detail="contact.hemea@gmail.com"
            onPress={() => Linking.openURL('mailto:contact.hemea@gmail.com')}
            isLast
          />
        </ListSection>

        <ListSection title="Légal">
          <ListRow
            icon="shield-outline"
            title="Confidentialité & sécurité"
            onPress={() => router.push('/settings/privacy')}
          />
          <ListRow
            icon="document-outline"
            title="Politique de confidentialité"
            onPress={() => router.push('/settings/privacy-policy')}
            isLast
          />
        </ListSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
});
