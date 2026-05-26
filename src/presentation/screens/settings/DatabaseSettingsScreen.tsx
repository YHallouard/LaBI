import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useUseCases } from '../../contexts/UseCasesContext';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, Banner, PrimaryButton, ListRow, ListSection, ModalGrabber,
} from '../../../design-system';

export function DatabaseSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle, onManualReload } = useUseCases();

  const [isResetting, setIsResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser la base de données',
      'Cette action supprimera toutes vos analyses et votre profil. Cette opération est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            if (!bundle) return;
            setIsResetting(true);
            setErrorMsg(null);
            try {
              await bundle.resetDatabase.execute();
              setSuccessMsg('Base de données réinitialisée. Redémarrage…');
              setTimeout(() => {
                onManualReload();
              }, 1500);
            } catch (e) {
              setErrorMsg(`Échec de la réinitialisation : ${e instanceof Error ? e.message : 'inconnue'}`);
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  if (isResetting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.small, { color: colors.textBody, marginTop: spacing[3] }]}>
          Réinitialisation en cours…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ModalGrabber />
      <ScreenHeader title="Base de données" subtitle="Stockage local SQLite" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {successMsg && <Banner kind="success">{successMsg}</Banner>}
        {errorMsg && <Banner kind="error">{errorMsg}</Banner>}

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[typography.small, { color: colors.textBody, flex: 1 }]}>
              Toutes vos analyses sont stockées localement dans une base SQLite chiffrée (SQLCipher). Vos données ne quittent jamais votre appareil.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <ListSection title="Informations">
          <ListRow
            icon="server-outline"
            title="Stockage"
            detail="SQLite chiffrée (SQLCipher)"
          />
          <ListRow
            icon="phone-portrait-outline"
            title="Emplacement"
            detail="Appareil uniquement"
            isLast
          />
        </ListSection>

        {/* Danger zone */}
        <View style={styles.dangerZone}>
          <Text style={[typography.label, { color: colors.danger, marginBottom: spacing[2] }]}>
            Zone de danger
          </Text>
          <Text style={[typography.small, { color: colors.textBody, marginBottom: spacing[4] }]}>
            La réinitialisation supprimera définitivement toutes les analyses et votre profil. Cette action est irréversible.
          </Text>
          <PrimaryButton
            onPress={handleReset}
            variant="danger"
            size="md"
          >
            Réinitialiser la base de données
          </PrimaryButton>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  infoCard: {
    backgroundColor: colors.bgBlue,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  infoRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' },
  dangerZone: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(229,54,63,0.15)',
    ...elevation[1],
  },
});
