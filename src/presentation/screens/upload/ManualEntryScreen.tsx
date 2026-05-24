import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUseCases } from '../../contexts/UseCasesContext';
import { LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS } from '../../../config/LabConfig';
import {
  colors, spacing, radii, elevation,
  typography, Banner,
} from '../../../design-system';

export function ManualEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setValue = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    if (!bundle) return;
    const markers: Record<string, number> = {};
    Object.entries(values).forEach(([k, v]) => {
      const n = parseFloat(v.replace(',', '.'));
      if (!isNaN(n)) markers[k] = n;
    });
    if (Object.keys(markers).length === 0) {
      setError('Entrez au moins une valeur.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await bundle.createAnalysis.execute({ date: new Date().toISOString(), markers, labName: 'Saisie manuelle' } as any);
      router.back();
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.grabber} />
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={[typography.body, { color: colors.primary }]}>Annuler</Text>
        </Pressable>
        <Text style={[typography.lead, styles.headerTitle]}>Saisie manuelle</Text>
        {loading
          ? <ActivityIndicator color={colors.primary} style={{ width: 70 }} />
          : <Pressable onPress={handleSave} style={{ width: 70, alignItems: 'flex-end' }}>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>Enregistrer</Text>
            </Pressable>
        }
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {error && <View style={styles.errorWrap}><Banner kind="error">{error}</Banner></View>}
        {Object.entries(LAB_VALUE_CATEGORIES).map(([catLabel, markerKeys]) => (
          <View key={catLabel} style={styles.catBlock}>
            <Text style={[typography.label, styles.catLabel]}>{catLabel}</Text>
            {(markerKeys as string[]).map((key) => (
              <View key={key} style={styles.inputRow}>
                <View style={styles.inputLabel}>
                  <Text style={[typography.body, { color: colors.textStrong }]}>{key}</Text>
                  <Text style={[typography.caption, { color: colors.textFaint }]}>{LAB_VALUE_UNITS[key] ?? ''}</Text>
                </View>
                <TextInput
                  value={values[key] ?? ''}
                  onChangeText={(v) => setValue(key, v)}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  errorWrap: { marginBottom: spacing[4] },
  catBlock: { marginBottom: spacing[4] },
  catLabel: { paddingBottom: spacing[2] },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgElevated, borderRadius: radii.md, paddingHorizontal: spacing[4],
    paddingVertical: spacing[3], marginBottom: spacing[2], ...elevation[1],
  },
  inputLabel: { flex: 1, gap: 2 },
  input: {
    width: 90, textAlign: 'right', fontSize: 16, fontWeight: '600',
    color: colors.textStrong,
    borderBottomWidth: 1.5, borderBottomColor: colors.primary, paddingBottom: 2,
  },
});
