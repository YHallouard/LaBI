import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors, spacing,
  typography, ScreenHeader, ListSection, ListRow, HemeaWordmark, ModalGrabber,
} from '../../../design-system';

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ModalGrabber />
      <View style={styles.headerSpacer} />
      <ScreenHeader 
        title="Réglages" 
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <ListSection title="Compte">
          <ListRow icon="person-outline" title="Profil" onPress={() => router.push('/settings/profile')} />
          <ListRow icon="key-outline" title="Clé API Mistral" onPress={() => router.push('/settings/api-key')} isLast />
        </ListSection>

        <ListSection title="Données">
          <ListRow icon="sync-outline" title="Synchronisation" onPress={() => router.push('/settings/sync')} />
          <ListRow icon="server-outline" title="Base de données" onPress={() => router.push('/settings/database')} isLast />
        </ListSection>

        <ListSection title="Support">
          <ListRow icon="shield-outline" title="Confidentialité" onPress={() => router.push('/settings/privacy')} />
          <ListRow icon="help-circle-outline" title="Centre d'aide" onPress={() => router.push('/settings/help')} />
          <ListRow icon="information-circle-outline" title="À propos" onPress={() => router.push('/settings/about')} isLast />
        </ListSection>

        <View style={styles.footer}>
          <HemeaWordmark size={14} color={colors.textFaint} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerSpacer: { height: spacing[3] },
  content: { paddingTop: spacing[2] },
  footer: { alignItems: 'center', paddingVertical: spacing[6] },
});
