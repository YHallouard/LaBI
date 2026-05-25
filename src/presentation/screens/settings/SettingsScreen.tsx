import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors, spacing,
  typography, ScreenHeader, ListSection, ListRow, HemeaWordmark,
} from '../../../design-system';

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const dismiss = () => router.back();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Modal header */}
      <View style={styles.modalHeader}>
        <View style={styles.grabber} />
        <Pressable onPress={dismiss} style={styles.closeBtn}>
          <Text style={[typography.body, { color: colors.primary }]}>Fermer</Text>
        </Pressable>
        <ScreenHeader title="Réglages" />
      </View>

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
  modalHeader: { paddingTop: spacing[2] },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
  closeBtn: {
    position: 'absolute',
    right: spacing[4],
    top: spacing[3],
    zIndex: 10,
    paddingVertical: spacing[1],
  },
  content: { paddingTop: spacing[2] },
  footer: { alignItems: 'center', paddingVertical: spacing[6] },
});
