import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUseCases } from '../../contexts/UseCasesContext';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, Banner, PrimaryButton, ListRow, ListSection,
} from '../../../design-system';

export function ApiKeySettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bundle, onApiKeySaved, onApiKeyDeleted } = useUseCases();

  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadKey = async () => {
      if (!bundle) return;
      try {
        const k = await bundle.loadApiKey.execute();
        if (k) {
          setApiKey(k);
          setSavedKey(k);
        } else {
          setIsEditing(true);
        }
      } catch {
        setErrorMsg('Impossible de charger la clé API.');
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadKey();
  }, [bundle]);

  const handleSave = async () => {
    if (!apiKey.trim() || !bundle) { setErrorMsg('La clé API est requise.'); return; }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      await bundle.saveApiKey.execute(apiKey.trim());
      await onApiKeySaved(apiKey.trim());
      setSavedKey(apiKey.trim());
      setIsEditing(false);
      setSuccessMsg('Clé API enregistrée. Mistral est prêt.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      setErrorMsg(`Erreur : ${e instanceof Error ? e.message : 'inconnue'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bundle) return;
    setIsDeleting(true);
    try {
      await bundle.deleteApiKey.execute();
      onApiKeyDeleted();
      setApiKey('');
      setSavedKey('');
      setIsEditing(true);
      setSuccessMsg(null);
    } catch (e) {
      setErrorMsg(`Erreur : ${e instanceof Error ? e.message : 'inconnue'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const maskedKey = savedKey.length > 8
    ? '•'.repeat(savedKey.length - 4) + savedKey.slice(-4)
    : savedKey ? '••••' : null;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Clé API Mistral" subtitle="OCR et extraction des analyses" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {successMsg && <Banner kind="success">{successMsg}</Banner>}
        {errorMsg && <Banner kind="error">{errorMsg}</Banner>}

        {/* Current key status */}
        {!isEditing && maskedKey && (
          <ListSection title="Clé configurée">
            <ListRow
              icon="key-outline"
              title={maskedKey}
              detail="Active"
              isLast
            />
          </ListSection>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[typography.small, { color: colors.textBody, flex: 1 }]}>
              La clé API Mistral est nécessaire pour utiliser l&apos;OCR sur vos PDFs de bilans sanguins. Elle est stockée de façon sécurisée sur votre appareil.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings/api-key-tutorial')}
            style={styles.tutorialLink}
          >
            <Text style={styles.tutorialLinkText}>Comment obtenir une clé API Mistral ?</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>

        {/* Form */}
        {isEditing && (
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Clé API</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              <Pressable onPress={() => setShowKey(s => !s)} style={styles.toggleVis} hitSlop={8}>
                <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.btnGroup}>
              <PrimaryButton onPress={handleSave} size="lg" loading={isSaving}>
                Enregistrer
              </PrimaryButton>
              {savedKey && (
                <PrimaryButton onPress={() => { setIsEditing(false); setApiKey(savedKey); setErrorMsg(null); }} variant="ghost" size="md">
                  Annuler
                </PrimaryButton>
              )}
            </View>
          </View>
        )}

        {/* Actions for existing key */}
        {!isEditing && savedKey && (
          <View style={styles.actions}>
            <PrimaryButton onPress={() => setIsEditing(true)} variant="secondary" size="md">
              Modifier la clé
            </PrimaryButton>
            <PrimaryButton onPress={handleDelete} variant="danger" size="md" loading={isDeleting}>
              Supprimer la clé
            </PrimaryButton>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: spacing[3],
  },
  infoRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' },
  tutorialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tutorialLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  formSection: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: spacing[3],
    ...elevation[1],
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textBody,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  input: {
    fontSize: 15,
    color: colors.textStrong,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toggleVis: {
    padding: spacing[2],
  },
  btnGroup: { gap: spacing[2] },
  actions: { gap: spacing[2] },
});
