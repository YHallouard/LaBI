import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUseCases } from '../../contexts/UseCasesContext';
import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS } from '../../../config/LabConfig';
import {
  colors, spacing, radii, elevation,
  typography, Banner,
  ScreenHeader,
} from '../../../design-system';

export function ManualEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();
  const [values, setValues] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setValue = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleSave = async () => {
    if (!bundle) return;
    const labValues: Record<string, LabValue> = {};
    Object.entries(values).forEach(([k, v]) => {
      const n = parseFloat(v.replace(',', '.'));
      if (!isNaN(n)) labValues[k] = { value: n, unit: LAB_VALUE_UNITS[k] ?? '' };
    });
    if (Object.keys(labValues).length === 0) {
      setError('Entrez au moins une valeur.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const analysis: BiologicalAnalysis = { id: '', date, ...labValues };
      await bundle.createAnalysis.execute(analysis);
      router.back();
    } catch {
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.grabber} />
      <ScreenHeader
        title="Saisie manuelle"
        subtitle="Entrez les valeurs manuellement"
        onBack={() => router.back()}
        right={
          loading
            ? <ActivityIndicator color={colors.primary} style={{ width: 70 }} />
            : <Pressable onPress={handleSave} style={{ width: 90, alignItems: 'flex-end' }}>
              <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>Enregistrer</Text>
            </Pressable>
          }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {error && <View style={styles.errorWrap}><Banner kind="error">{error}</Banner></View>}

        <View style={styles.catBlock}>
          <Text style={[typography.label, styles.catLabel]}>Date du bilan</Text>
          <Pressable onPress={() => setShowDatePicker(v => !v)} style={styles.dateBtn}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>
          {showDatePicker && (
            <View style={styles.datePicker}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  if (d) setDate(d);
                  if (Platform.OS === 'android') setShowDatePicker(false);
                }}
                maximumDate={new Date()}
                minimumDate={new Date(2000, 0, 1)}
                style={Platform.OS === 'ios' ? { height: 180 } : undefined}
              />
              {Platform.OS === 'ios' && (
                <Pressable onPress={() => setShowDatePicker(false)} style={styles.datePickerDone}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Confirmer</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

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
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...elevation[1],
  },
  dateBtnText: { flex: 1, fontSize: 16, color: colors.textStrong },
  datePicker: {
    marginTop: spacing[2],
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  datePickerDone: {
    alignItems: 'center',
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
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
