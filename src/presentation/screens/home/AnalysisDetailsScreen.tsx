import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { useUseCases } from '../../contexts/UseCasesContext';
import { LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS, LAB_VALUE_DEFAULT_RANGES } from '../../../config/LabConfig';
import {
  colors, spacing,
  typography, ScreenHeader, ListSection, ListRow, PrimaryButton,
} from '../../../design-system';

function isOutOfRange(key: string, value: number | null | undefined): boolean {
  if (value == null) return false;
  const range = LAB_VALUE_DEFAULT_RANGES[key as keyof typeof LAB_VALUE_DEFAULT_RANGES];
  if (!range) return false;
  return value < range.min || value > range.max;
}

export function AnalysisDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();
  const [analysis, setAnalysis] = useState<BiologicalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!bundle || !id) return;
      bundle.getAnalysisById.execute(id).then((a) => { setAnalysis(a ?? null); setLoading(false); });
    }, [bundle, id]),
  );

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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Détail du bilan"
        subtitle={date}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(LAB_VALUE_CATEGORIES).map(([catLabel, markerKeys]) => {
          const catMarkers = (markerKeys as string[]).filter((key) => {
            const v = analysis[key];
            return v != null && typeof v === 'object' && 'value' in (v as object);
          });
          if (catMarkers.length === 0) return null;
          return (
            <ListSection key={catLabel} title={catLabel}>
              {catMarkers.map((key, i) => {
                const labVal = analysis[key] as LabValue;
                const outOfRange = isOutOfRange(key, labVal.value);
                return (
                  <ListRow
                    key={key}
                    title={key}
                    detail={`${labVal.value?.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) ?? '—'} ${LAB_VALUE_UNITS[key] ?? ''}`}
                    alert={outOfRange}
                    isLast={i === catMarkers.length - 1}
                  />
                );
              })}
            </ListSection>
          );
        })}

        <View style={styles.deleteWrap}>
          <PrimaryButton variant="danger" size="lg" onPress={handleDelete} style={{ width: '100%' }}>
            Supprimer cette analyse
          </PrimaryButton>
        </View>
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
});
