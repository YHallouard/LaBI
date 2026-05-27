import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { useUseCases } from '../../contexts/UseCasesContext';
import { LAB_VALUE_DEFAULT_RANGES } from '../../../config/LabConfig';
import {
  colors, spacing,
  typography, ScreenHeader, AnalysisCard,
} from '../../../design-system';

function countOutOfRange(a: BiologicalAnalysis): { total: number; outOfRange: number } {
  const keys = Object.keys(a).filter((k) => !['id', 'date', 'pdfSource'].includes(k));
  let outOfRange = 0;
  let total = 0;
  for (const key of keys) {
    const v = a[key] as LabValue | undefined;
    if (!v || typeof v !== 'object' || v.value == null) continue;
    total++;
    const range = LAB_VALUE_DEFAULT_RANGES[key as keyof typeof LAB_VALUE_DEFAULT_RANGES];
    if (range && (v.value < range.min || v.value > range.max)) outOfRange++;
  }
  return { total, outOfRange };
}

export function AllAnalysesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!bundle) return;
      bundle.getAnalyses.execute().then((a) => {
        setAnalyses([...a].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()));
        setLoading(false);
      });
    }, [bundle]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Mes analyses" onBack={() => router.back()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[typography.body, { textAlign: 'center', color: colors.textBody }]}>
                Aucune analyse. Importez un PDF ou saisissez manuellement.
              </Text>
            </View>
          }
          renderItem={({ item: a }) => {
            const { total, outOfRange } = countOutOfRange(a);
            const hasAlert = outOfRange > 0;
            const label = total > 0 ? `${total} marqueur${total > 1 ? 's' : ''}` : 'Analyse';
            const value = hasAlert ? `${outOfRange} hors norme` : 'Normal';
            return (
              <AnalysisCard
                date={new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                label={label}
                value={value}
                unit=""
                alert={hasAlert}
                onPress={() => router.push(`/analyses/${a.id}`)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  empty: { paddingVertical: spacing[8], paddingHorizontal: spacing[4] },
});
