import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useUseCases } from '../../contexts/UseCasesContext';
import { useAnalysisProgress, AnalysisStepStatus } from '../../hooks/useAnalysisProgress';
import { LAB_VALUE_CATEGORIES } from '../../../config/LabConfig';
import {
  colors, spacing, radii, elevation, typography, Banner, PrimaryButton,
  ScreenHeader,
} from '../../../design-system';

const STEPS = [
  'Envoi du document à Mistral',
  'Extraction de la date',
  ...Object.keys(LAB_VALUE_CATEGORIES).map((cat) => `Analyse : ${cat}`),
  'Enregistrement de l\'analyse',
  'Suppression du document Mistral',
];

function StepRow({ label, status }: { label: string; status: AnalysisStepStatus }) {
  const done = status === 'completed';
  const active = status === 'in_progress';
  const failed = status === 'failed';
  return (
    <View style={styles.stepRow}>
      {done ? (
        <Ionicons name="checkmark-circle" size={20} color={colors.successDeep} />
      ) : failed ? (
        <Ionicons name="alert-circle" size={20} color={colors.danger} />
      ) : active ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />
      )}
      <Text style={[
        typography.small,
        styles.stepLabel,
        done && { color: colors.successDeep },
        active && { color: colors.primary, fontWeight: '600' },
        failed && { color: colors.danger },
      ]}>
        {label}
      </Text>
    </View>
  );
}

export function AIImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle, apiKeyError, checkAndLoadApiKey, isReady } = useUseCases();

  const [analyzing, setAnalyzing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSucceededRef = useRef(false);

  const analyzePdfUseCase = bundle?.analyzePdfUseCase ?? null;
  const eventBus = analyzePdfUseCase?.getEventBus?.();
  const { stepStates, reset } = useAnalysisProgress(eventBus, STEPS);

  const hasApiKey = !apiKeyError && Boolean(analyzePdfUseCase);

  const handleImport = async () => {
    if (analyzing) return;
    if (!hasApiKey) {
      if (!apiKeyError) await checkAndLoadApiKey();
      setError(apiKeyError ?? 'Clé API non configurée. Configurez-la dans Réglages.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;

    setAnalyzing(true);
    setError(null);
    setSuccess(false);
    reset();
    lastSucceededRef.current = false;
    try {
      await analyzePdfUseCase!.execute(result.assets[0].uri);
      lastSucceededRef.current = true;
      setSuccess(true);
    } catch {
      setError('Échec du traitement du PDF. Vérifiez votre clé API Mistral et réessayez.');
    } finally {
      analyzePdfUseCase!.removeProcessingListeners?.();
      setAnalyzing(false);
    }
  };

  const isLoading = !isReady;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[typography.small, { color: colors.textBody, marginTop: spacing[3] }]}>
          Chargement…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.grabber} />
      <ScreenHeader
        title="Import IA"
        subtitle="Sélectionnez un PDF de bilan sanguin. Mistral en extraira automatiquement les valeurs."
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {success && (
          <View style={styles.bannerWrap}>
            <Banner kind="success">Analyse extraite et enregistrée avec succès.</Banner>
          </View>
        )}

        {error && (
          <View style={styles.bannerWrap}>
            <Banner kind="error">{error}</Banner>
          </View>
        )}

        {!hasApiKey && !error && (
          <View style={styles.bannerWrap}>
            <Banner kind="warning">
              {apiKeyError ?? 'Clé API Mistral non configurée.'}
            </Banner>
            <Pressable
              onPress={() => router.push('/settings/api-key')}
              style={styles.settingsLink}
            >
              <Ionicons name="settings-outline" size={14} color={colors.primary} />
              <Text style={[typography.small, { color: colors.primary, fontWeight: '600' }]}>
                Configurer dans Réglages
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.uploadZone}>
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[typography.lead, styles.uploadTitle]}>Sélectionnez un PDF</Text>
          <Text style={[typography.small, styles.uploadHint]}>
            Bilan sanguin, biochimie, lipides… L&apos;extraction des valeurs est automatique.
          </Text>
          <PrimaryButton
            onPress={handleImport}
            disabled={analyzing}
            size="lg"
          >
            {analyzing ? 'Analyse en cours…' : 'Sélectionner & analyser PDF'}
          </PrimaryButton>
        </View>

        {analyzing && (
          <View style={styles.stepsCard}>
            {STEPS.map((step) => (
              <StepRow key={step} label={step} status={stepStates.get(step) ?? 'pending'} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  grabber: {
    width: 38, height: 4, borderRadius: 999, backgroundColor: colors.border,
    alignSelf: 'center', marginTop: spacing[2], marginBottom: spacing[2],
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingBottom: spacing[3],
  },
  cancelBtn: { width: 70 },
  headerTitle: { color: colors.textStrong, fontWeight: '700' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[3], gap: spacing[3] },
  description: { color: colors.textBody, textAlign: 'center', marginBottom: spacing[2] },
  bannerWrap: { gap: spacing[2] },
  settingsLink: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[1],
    alignSelf: 'flex-start', marginTop: spacing[1],
  },
  uploadZone: {
    backgroundColor: colors.bgBlue,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii['2xl'],
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    gap: spacing[3],
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation[2],
  },
  uploadTitle: {
    color: colors.textStrong,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadHint: {
    color: colors.textBody,
    textAlign: 'center',
    maxWidth: 280,
  },
  stepsCard: {
    backgroundColor: colors.bgElevated, borderRadius: radii.xl,
    padding: spacing[4], gap: spacing[2], ...elevation[2],
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  stepLabel: { flex: 1 },
});
