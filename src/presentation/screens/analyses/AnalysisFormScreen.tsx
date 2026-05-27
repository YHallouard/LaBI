import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { useUseCases } from '../../contexts/UseCasesContext';
import {
  LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS, LAB_VALUE_DEFAULT_RANGES,
} from '../../../config/LabConfig';
import {
  colors, spacing, radii,
  typography, ScreenHeader, ListSection, PrimaryButton, Banner, ModalGrabber,
} from '../../../design-system';

function isOutOfRange(key: string, value: number | null | undefined): boolean {
  if (value == null) return false;
  const range = LAB_VALUE_DEFAULT_RANGES[key as keyof typeof LAB_VALUE_DEFAULT_RANGES];
  if (!range) return false;
  return value < range.min || value > range.max;
}

function ValueRow({ label, value, unit, outOfRange, isLast, rangeMin, rangeMax }: {
  label: string; value: string; unit: string; outOfRange: boolean; isLast: boolean;
  rangeMin?: number; rangeMax?: number;
}) {
  return (
    <View style={[styles.valueRow, !isLast && styles.valueRowBorder]}>
      <View style={styles.valueRowLeft}>
        <Text style={styles.valueRowLabel} numberOfLines={1}>{label}</Text>
        {rangeMin != null && rangeMax != null && (
          <Text style={styles.valueRowRange}>
            Plage : {rangeMin} – {rangeMax}{unit ? ` ${unit}` : ''}
          </Text>
        )}
      </View>
      <Text style={outOfRange ? typography.valueAlert : typography.value}>
        {value}
        {unit ? <Text style={styles.valueUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function EditRow({ label, value, unit, onChangeText, isLast, rangeMin, rangeMax }: {
  label: string; value: string; unit: string;
  onChangeText: (v: string) => void; isLast: boolean;
  rangeMin?: number; rangeMax?: number;
}) {
  return (
    <View style={[styles.valueRow, !isLast && styles.valueRowBorder]}>
      <View style={styles.valueRowLeft}>
        <Text style={styles.valueRowLabel} numberOfLines={1}>{label}</Text>
        {rangeMin != null && rangeMax != null && (
          <Text style={styles.valueRowRange}>
            Plage : {rangeMin} – {rangeMax}{unit ? ` ${unit}` : ''}
          </Text>
        )}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textMuted}
        style={styles.editInput}
        selectTextOnFocus
      />
      {unit ? <Text style={styles.editUnit}>{unit}</Text> : null}
    </View>
  );
}

export function AnalysisFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();
  const isNew = !id;

  const [analysis, setAnalysis] = useState<BiologicalAnalysis | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [editMode, setEditMode] = useState(isNew);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const seedValuesFromAnalysis = (a: BiologicalAnalysis) => {
    const vals: Record<string, string> = {};
    Object.values(LAB_VALUE_CATEGORIES).flat().forEach((key) => {
      const v = a[key as keyof BiologicalAnalysis] as LabValue | undefined;
      if (v?.value != null) vals[key] = String(v.value);
    });
    setValues(vals);
  };

  useFocusEffect(
    useCallback(() => {
      if (isNew || !bundle || !id) return;
      bundle.getAnalysisById.execute(id).then((a) => {
        if (a) {
          setAnalysis(a);
          setDate(new Date(a.date));
          seedValuesFromAnalysis(a);
        }
        setLoading(false);
      });
    }, [bundle, id, isNew]),
  );

  const enterEdit = () => {
    setEditMode(true);
    setErrorMsg(null);
  };

  const cancelEdit = () => {
    if (isNew) {
      router.back();
      return;
    }
    setEditMode(false);
    setErrorMsg(null);
    if (analysis) {
      setDate(new Date(analysis.date));
      seedValuesFromAnalysis(analysis);
    }
  };

  const setValue = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    if (!bundle) return;
    setErrorMsg(null);

    const labValues: Record<string, LabValue> = {};
    Object.entries(values).forEach(([k, v]) => {
      const n = parseFloat(v.replace(',', '.'));
      if (!isNaN(n)) labValues[k] = { value: n, unit: LAB_VALUE_UNITS[k] ?? '' };
    });

    if (Object.keys(labValues).length === 0) {
      setErrorMsg('Entrez au moins une valeur.');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const newAnalysis: BiologicalAnalysis = { id: '', date, ...labValues };
        await bundle.createAnalysis.execute(newAnalysis);
        router.back();
      } else if (analysis) {
        const updated: BiologicalAnalysis = { ...analysis, date, ...labValues };
        await bundle.updateAnalysis.execute(updated);
        setAnalysis(updated);
        setEditMode(false);
      }
    } catch (e) {
      setErrorMsg(`Erreur : ${e instanceof Error ? e.message : 'inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer', 'Supprimer cette analyse ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          if (!bundle || !id) return;
          await bundle.deleteAnalysis.execute(id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isNew && !analysis) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={[typography.body, { color: colors.textBody }]}>Analyse introuvable.</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={[typography.body, { color: colors.primary }]}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const title = isNew ? 'Nouvelle analyse' : 'Détail du bilan';
  const subtitle = isNew ? 'Saisie manuelle' : formattedDate;

  const headerRight = editMode ? (
    <View style={styles.headerActions}>
      <Pressable onPress={cancelEdit} style={styles.headerActionBtn}>
        <Text style={[typography.body, { color: colors.textBody }]}>Annuler</Text>
      </Pressable>
      <Pressable onPress={handleSave} disabled={saving} style={styles.headerActionBtn}>
        <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
          {saving ? '…' : 'Enregistrer'}
        </Text>
      </Pressable>
    </View>
  ) : (
    <Pressable onPress={enterEdit} hitSlop={8}>
      <Ionicons name="pencil-outline" size={20} color={colors.primary} />
    </Pressable>
  );

  return (
    <View style={[styles.root, { paddingTop: isNew ? 0 : insets.top }]}>
      {isNew && <ModalGrabber />}
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        onBack={editMode ? cancelEdit : () => router.back()}
        right={headerRight}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {errorMsg && (
          <View style={styles.errorWrap}>
            <Banner kind="error">{errorMsg}</Banner>
          </View>
        )}

        {editMode && (
          <ListSection title="Date du bilan">
            <Pressable onPress={() => setShowDatePicker((v) => !v)} style={styles.dateBtn}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateBtnText}>{formattedDate}</Text>
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
          </ListSection>
        )}

        {Object.entries(LAB_VALUE_CATEGORIES).map(([catLabel, markerKeys]) => {
          const keys = markerKeys as string[];
          // In view mode, only show markers with a value
          const visibleKeys = editMode
            ? keys
            : keys.filter((key) => {
                const v = analysis?.[key as keyof BiologicalAnalysis];
                return v != null && typeof v === 'object' && 'value' in (v as object);
              });
          if (visibleKeys.length === 0) return null;

          return (
            <ListSection key={catLabel} title={catLabel}>
              {visibleKeys.map((key, i) => {
                const unit = LAB_VALUE_UNITS[key] ?? '';
                const range = LAB_VALUE_DEFAULT_RANGES[key as keyof typeof LAB_VALUE_DEFAULT_RANGES];
                const isLast = i === visibleKeys.length - 1;

                if (editMode) {
                  return (
                    <EditRow
                      key={key}
                      label={key}
                      value={values[key] ?? ''}
                      unit={unit}
                      onChangeText={(v) => setValue(key, v)}
                      isLast={isLast}
                      rangeMin={range?.min}
                      rangeMax={range?.max}
                    />
                  );
                }

                const labVal = analysis?.[key as keyof BiologicalAnalysis] as LabValue | undefined;
                const displayValue = labVal?.value?.toLocaleString('fr-FR', { maximumFractionDigits: 3 }) ?? '—';
                const outOfRange = isOutOfRange(key, labVal?.value);
                return (
                  <ValueRow
                    key={key}
                    label={key}
                    value={displayValue}
                    unit={unit}
                    outOfRange={outOfRange}
                    isLast={isLast}
                    rangeMin={range?.min}
                    rangeMax={range?.max}
                  />
                );
              })}
            </ListSection>
          );
        })}

        {!editMode && !isNew && (
          <View style={styles.deleteWrap}>
            <PrimaryButton variant="danger" size="lg" onPress={handleDelete} style={{ width: '100%' }}>
              Supprimer cette analyse
            </PrimaryButton>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  backLink: { marginTop: spacing[3] },
  content: { paddingTop: spacing[2] },
  errorWrap: { paddingHorizontal: spacing[4], marginBottom: spacing[3] },
  deleteWrap: { paddingHorizontal: spacing[4], paddingTop: spacing[6] },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
  },
  valueRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  valueRowLeft: { flex: 1, marginRight: spacing[3] },
  valueRowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  valueRowRange: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  valueUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },

  editInput: {
    ...typography.value,
    color: colors.text,
    textAlign: 'right',
    minWidth: 60,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: colors.bgBlue,
    borderRadius: radii.sm,
    fontVariant: ['tabular-nums'],
  },
  editUnit: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 4,
    minWidth: 32,
  },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  dateBtnText: { flex: 1, fontSize: 16, color: colors.textStrong },
  datePicker: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  datePickerDone: {
    alignItems: 'center',
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  headerActions: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  headerActionBtn: {
    paddingVertical: spacing[1],
  },
});
