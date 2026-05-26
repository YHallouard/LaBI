import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { useUseCases } from '../../contexts/UseCasesContext';
import { LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS, LAB_VALUE_DEFAULT_RANGES } from '../../../config/LabConfig';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, ListSection, PrimaryButton,
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

function EditRow({ label, value, unit, onChangeText, rangeMin, rangeMax }: {
  label: string; value: string; unit: string; onChangeText: (v: string) => void;
  rangeMin?: number; rangeMax?: number;
}) {
  return (
    <View style={[styles.valueRow, styles.valueRowBorder]}>
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
        style={styles.editInput}
        selectTextOnFocus
      />
      {unit ? <Text style={styles.editUnit}>{unit}</Text> : null}
    </View>
  );
}

export function AnalysisDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();

  const [analysis, setAnalysis] = useState<BiologicalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!bundle || !id) return;
      bundle.getAnalysisById.execute(id).then((a) => { setAnalysis(a ?? null); setLoading(false); });
    }, [bundle, id]),
  );

  const enterEdit = () => {
    if (!analysis) return;
    const vals: Record<string, string> = {};
    Object.values(LAB_VALUE_CATEGORIES).flat().forEach((key) => {
      const v = analysis[key as keyof BiologicalAnalysis] as LabValue | undefined;
      if (v?.value != null) vals[key] = String(v.value);
    });
    setEditValues(vals);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditValues({});
  };

  const handleSave = async () => {
    if (!bundle || !analysis) return;
    setSaving(true);
    try {
      let updated = analysis;
      for (const [key, strVal] of Object.entries(editValues)) {
        const num = parseFloat(strVal);
        if (isNaN(num)) continue;
        const original = analysis[key as keyof BiologicalAnalysis] as LabValue | undefined;
        if (original?.value !== num) {
          updated = await bundle.updateAnalysis.updateLabValue(analysis.id, key, num);
        }
      }
      setAnalysis(updated);
      setEditMode(false);
    } catch (e) {
      Alert.alert('Erreur', `${e}`);
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

  if (!analysis) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={[typography.body, { color: colors.textBody }]}>Analyse introuvable.</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={[typography.body, { color: colors.primary }]}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const date = new Date(analysis.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const headerRight = editMode ? (
    <View style={styles.headerActions}>
      <Pressable onPress={cancelEdit} style={styles.headerActionBtn}>
        <Text style={[typography.body, { color: colors.textBody }]}>Annuler</Text>
      </Pressable>
      <Pressable onPress={handleSave} disabled={saving} style={styles.headerActionBtn}>
        <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Détail du bilan"
        subtitle={date}
        onBack={editMode ? cancelEdit : () => router.back()}
        right={headerRight}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {Object.entries(LAB_VALUE_CATEGORIES).map(([catLabel, markerKeys]) => {
          const catMarkers = (markerKeys as string[]).filter((key) => {
            const v = analysis[key as keyof BiologicalAnalysis];
            return v != null && typeof v === 'object' && 'value' in (v as object);
          });
          if (catMarkers.length === 0) return null;
          return (
            <ListSection key={catLabel} title={catLabel}>
              <View style={styles.card}>
                {catMarkers.map((key, i) => {
                  const labVal = analysis[key as keyof BiologicalAnalysis] as LabValue;
                  const displayValue = labVal.value?.toLocaleString('fr-FR', { maximumFractionDigits: 3 }) ?? '—';
                  const unit = LAB_VALUE_UNITS[key] ?? '';
                  const outOfRange = isOutOfRange(key, labVal.value);
                  const isLast = i === catMarkers.length - 1;
                  const range = LAB_VALUE_DEFAULT_RANGES[key as keyof typeof LAB_VALUE_DEFAULT_RANGES];

                  if (editMode && editValues[key] !== undefined) {
                    return (
                      <EditRow
                        key={key}
                        label={key}
                        value={editValues[key]}
                        unit={unit}
                        onChangeText={(v) => setEditValues(prev => ({ ...prev, [key]: v }))}
                        rangeMin={range?.min}
                        rangeMax={range?.max}
                      />
                    );
                  }
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
              </View>
            </ListSection>
          );
        })}

        {!editMode && (
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
  deleteWrap: { paddingHorizontal: spacing[4], paddingTop: spacing[6] },

  // Value rows
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginHorizontal: spacing[4],
    marginBottom: spacing[1],
    ...elevation[1],
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
  },
  valueRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  valueRowLeft: {
    flex: 1,
    marginRight: spacing[3],
  },
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

  // Edit mode
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

  // Header action buttons (edit mode)
  headerActions: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  headerActionBtn: {
    paddingVertical: spacing[1],
  },
});
