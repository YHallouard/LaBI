import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { useUseCases } from '../../contexts/UseCasesContext';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, AnalysisCard,
} from '../../../design-system';

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
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <ScreenHeader title="Mes analyses" />
      </View>

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
            const labKeys = Object.keys(a).filter((k) => !['id', 'date', 'pdfSource'].includes(k));
            const firstKey = labKeys[0];
            const firstLabVal = firstKey ? (a[firstKey] as any) : null;
            return (
              <AnalysisCard
                date={new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                label={firstKey ?? 'Analyse'}
                value={firstLabVal?.value != null ? String(firstLabVal.value) : '—'}
                unit={firstLabVal?.unit ?? ''}
                alert={false}
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
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { paddingLeft: spacing[2], paddingTop: spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  empty: { paddingVertical: spacing[8], paddingHorizontal: spacing[4] },
});
