import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { UserProfile } from '../../../domain/UserProfile';
import { useUseCases } from '../../contexts/UseCasesContext';
import {
  colors,
  spacing,
  radii,
  elevation,
  typography,
  ScreenHeader,
  AnalysisCard,
  PrimaryButton,
  PersonAvatar,
  GlassFAB,
  HemeaWordmark,
} from '../../../design-system';

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();

  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!bundle) return;
    try {
      const [a, p] = await Promise.all([
        bundle.getAnalyses.execute(),
        bundle.retrieveUserProfileUseCase.execute(),
      ]);
      setAnalyses(a);
      setProfile(p);
    } finally {
      setLoading(false);
    }
  }, [bundle]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const recent = [...analyses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const displayName = profile?.name?.split(' ')[0] ?? 'vous';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Blue gradient hero */}
      <LinearGradient
        colors={['rgba(44,123,229,0.30)', 'rgba(44,123,229,0.10)', 'rgba(248,249,250,0.0)']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Brand mark */}
      <View style={styles.brandRow}>
        <HemeaWordmark size={16} />
      </View>

      {/* Profile hero */}
      <View style={styles.hero}>
        <PersonAvatar name={profile?.name} size={56} />
        <View style={styles.heroText}>
          <Text style={[typography.caption, styles.hello]}>Bonjour,</Text>
          <Text style={typography.h1}>{displayName}</Text>
          {profile && (
            <Text style={[typography.small, styles.meta]}>
              {bundle?.getUserAgeUseCase.execute(profile) ?? '—'} ans · {analyses.length} analyses
            </Text>
          )}
        </View>
        <GlassFAB onPress={() => router.push('/settings')} accessibilityLabel="Réglages">
          <Ionicons name="settings-outline" size={18} color={colors.textStrong} />
        </GlassFAB>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {analyses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[typography.h3, styles.emptyTitle]}>Aucune analyse</Text>
            <Text style={[typography.body, styles.emptyBody]}>
              Importez un bilan sanguin pour commencer.
            </Text>
            <PrimaryButton onPress={() => router.push('/upload')} size="md">
              Importer un PDF
            </PrimaryButton>
          </View>
        ) : (
          <>
            {/* Mes analyses CTA */}
            <Pressable
              onPress={() => router.push('/analyses')}
              style={({ pressed }) => [styles.analysesCta, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={styles.ctaIconWrap}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.ctaText}>
                <Text style={[typography.lead, styles.ctaTitle]}>Mes analyses</Text>
                <Text style={[typography.caption, styles.ctaCount]}>
                  {analyses.length} bilans importés
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Recent analyses */}
            <Text style={[typography.label, styles.sectionLabel]}>Récentes</Text>
            {recent.map((a) => {
              const labKeys = Object.keys(a).filter((k) => !['id', 'date', 'pdfSource'].includes(k));
              const firstKey = labKeys[0];
              const firstLabVal = firstKey ? (a[firstKey] as any) : null;
              const displayVal = firstLabVal?.value != null ? String(firstLabVal.value) : '—';
              return (
                <AnalysisCard
                  key={a.id}
                  date={new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  label={firstKey ?? 'Analyse'}
                  value={displayVal}
                  unit={firstLabVal?.unit ?? ''}
                  alert={false}
                  onPress={() => router.push(`/analyses/${a.id}`)}
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  brandRow: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[1],
    paddingBottom: 0,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  hello: {
    color: colors.textFaint,
    marginBottom: 2,
  },
  meta: {
    color: colors.textBody,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    gap: 0,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  analysesCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...elevation[2],
  },
  ctaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.lg,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    color: colors.textStrong,
  },
  ctaCount: {
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    paddingBottom: spacing[2],
    paddingTop: spacing[3],
  },
});
