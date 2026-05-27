import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path, Circle, Line as SvgLine, Text as SvgText,
  Defs, LinearGradient as SvgGradient, Stop, Rect,
} from 'react-native-svg';

import { LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { UserProfile } from '../../../domain/UserProfile';
import { HealthMagnitudeDataPoint } from '../../../domain/usecases/CalculateHealthMagnitudeUseCase';
import { useUseCases } from '../../contexts/UseCasesContext';
import { colors, spacing, radii, elevation } from '../../../design-system/tokens';
import { typography } from '../../../design-system/typography';
import { PersonAvatar } from '../../../design-system/components/PersonAvatar';
import { GlassFAB } from '../../../design-system/components/GlassFAB';
import { PrimaryButton } from '../../../design-system/components/PrimaryButton';
import { HemeaWordmark } from '../../../design-system/components/HemeaWordmark';

const SHRINK_RANGE = 80;
const STICKY_HEADER_HEIGHT = 64;
const WORDMARK_ROW_HEIGHT = 34;

// ─── BalanceTrendChart ────────────────────────────────────────────────────────
type ChartPoint = { t: number; v: number; label: string };

function BalanceTrendChart({ points, refMax = 1.0 }: { points: ChartPoint[]; refMax?: number }) {
  if (points.length === 0) return null;
  const W = 320, H = 110;
  const pad = { l: 6, r: 6, t: 8, b: 22 };
  // When all points share the same timestamp (e.g. analyses from same PDF date),
  // spread them evenly across the time axis so the chart remains readable.
  const rawMinT = Math.min(...points.map(p => p.t));
  const rawMaxT = Math.max(...points.map(p => p.t));
  const displayPoints = rawMaxT === rawMinT
    ? points.map((p, i) => ({ ...p, t: i }))
    : points;
  const maxV = Math.max(...displayPoints.map(p => p.v), refMax) * 1.15;
  const minT = Math.min(...displayPoints.map(p => p.t));
  const maxT = Math.max(...displayPoints.map(p => p.t));
  const xOf = (t: number) => pad.l + ((t - minT) / (maxT - minT || 1)) * (W - pad.l - pad.r);
  const yOf = (v: number) => H - pad.b - (v / maxV) * (H - pad.t - pad.b);
  const pathD = displayPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.t).toFixed(1)} ${yOf(p.v).toFixed(1)}`).join(' ');
  const bandTop = yOf(refMax);
  const bandBot = H - pad.b;
  const labelIdxs = [0, Math.floor((displayPoints.length - 1) / 2), displayPoints.length - 1].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="bal-band" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#00C800" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#00C800" stopOpacity={0.04} />
        </SvgGradient>
        <SvgGradient id="bal-line" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2C7BE5" />
          <Stop offset="1" stopColor="#4484B2" />
        </SvgGradient>
      </Defs>
      <SvgLine x1={pad.l} x2={W - pad.r} y1={pad.t} y2={pad.t} stroke="#F1F4F8" />
      <SvgLine x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="#F1F4F8" />
      <Rect
        x={0}
        y={Math.min(bandTop, bandBot)}
        width={W}
        height={Math.abs(bandBot - bandTop)}
        fill="url(#bal-band)"
      />
      <Path
        d={pathD}
        fill="none"
        stroke="url(#bal-line)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {displayPoints.map((p, i) => (
        <Circle
          key={i}
          cx={xOf(p.t)}
          cy={yOf(p.v)}
          r={i === displayPoints.length - 1 ? 5 : 3.5}
          fill={p.v > refMax ? colors.danger : colors.primary}
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}
      {labelIdxs.map(i => (
        <SvgText key={i} x={xOf(displayPoints[i].t)} y={H - 6} fontSize={9} fill={colors.chartAxisLabel} textAnchor="middle">
          {displayPoints[i].label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── BalanceCard ──────────────────────────────────────────────────────────────
function BalanceCard({ data }: { data: HealthMagnitudeDataPoint[] }) {
  if (data.length === 0) return null;
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = sorted[sorted.length - 1].magnitude;
  const isGood = latest <= 1.0;
  const points: ChartPoint[] = sorted.map(d => ({
    t: new Date(d.date).getTime(),
    v: d.magnitude,
    label: new Date(d.date).toLocaleDateString('fr-FR', { month: 'numeric', year: '2-digit' }),
  }));

  return (
    <View style={balanceStyles.card}>
      <View style={balanceStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.label, { marginBottom: 2 }]}>Indicateur</Text>
          <Text style={[typography.h3, { marginBottom: 3 }]}>Équilibre biologique</Text>
          <Text style={[typography.small, { color: colors.textBody }]}>
            Évolution de votre score de déséquilibre
          </Text>
        </View>
        <View style={[balanceStyles.badge, { backgroundColor: isGood ? colors.successTint : colors.dangerTint }]}>
          <Text style={[balanceStyles.badgeVal, { color: isGood ? colors.successDeep : colors.danger }]}>
            {latest.toFixed(2)}
          </Text>
          <Text style={[balanceStyles.badgeSub, { color: isGood ? colors.successDeep : colors.danger }]}>
            actuel
          </Text>
        </View>
      </View>
      <BalanceTrendChart points={points} refMax={1.0} />
      <View style={balanceStyles.legend}>
        <View style={balanceStyles.legendLeft}>
          <View style={balanceStyles.legendSwatch} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>Zone d&apos;équilibre (≤ 1.00)</Text>
        </View>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Plus bas = meilleur</Text>
      </View>
    </View>
  );
}

const balanceStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeVal: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
  },
  badgeSub: { fontSize: 9, fontWeight: '600', opacity: 0.7 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 8, backgroundColor: 'rgba(0,200,0,0.22)', borderRadius: 3 },
});

// ─── PinnedMiniChart ──────────────────────────────────────────────────────────
function PinnedMiniChart({ points, refMin, refMax, id }: {
  points: { t: number; v: number }[];
  refMin: number;
  refMax: number;
  id: string;
}) {
  if (points.length < 2) return null;
  const W = 280, H = 60;
  const pad = { l: 4, r: 4, t: 4, b: 4 };
  const allV = points.map(p => p.v);
  const minV = Math.min(...allV, refMin > 0 ? refMin * 0.9 : 0);
  const maxV = Math.max(...allV, refMax) * 1.1;
  const minT = Math.min(...points.map(p => p.t));
  const maxT = Math.max(...points.map(p => p.t));
  const xOf = (t: number) => pad.l + ((t - minT) / (maxT - minT || 1)) * (W - pad.l - pad.r);
  const yOf = (v: number) => H - pad.b - ((v - minV) / (maxV - minV || 1)) * (H - pad.t - pad.b);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.t).toFixed(1)} ${yOf(p.v).toFixed(1)}`).join(' ');
  const hasBand = refMin < refMax;
  const safeId = id.replace(/[^a-zA-Z0-9]/g, '_');

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id={`pm-${safeId}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2C7BE5" />
          <Stop offset="1" stopColor="#4484B2" />
        </SvgGradient>
      </Defs>
      {hasBand && (
        <Rect
          x={0}
          y={Math.min(yOf(refMax), yOf(refMin))}
          width={W}
          height={Math.abs(yOf(refMax) - yOf(refMin))}
          fill="rgba(0,200,0,0.12)"
        />
      )}
      <Path d={pathD} fill="none" stroke={`url(#pm-${safeId})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const isOut = hasBand && (p.v < refMin || p.v > refMax);
        return (
          <Circle key={i} cx={xOf(p.t)} cy={yOf(p.v)} r={i === points.length - 1 ? 4 : 3} fill={isOut ? colors.danger : colors.primary} stroke="#fff" strokeWidth={1.2} />
        );
      })}
    </Svg>
  );
}

// ─── PinnedChartCard ──────────────────────────────────────────────────────────
type PinnedSeries = {
  key: string;
  unit: string;
  refMin: number;
  refMax: number;
  points: { t: number; v: number }[];
  lastVal: number;
};

function PinnedChartCard({ series, onUnpin }: { series: PinnedSeries; onUnpin: () => void }) {
  const isOut = series.refMin < series.refMax && (series.lastVal < series.refMin || series.lastVal > series.refMax);
  return (
    <View style={pinnedStyles.card}>
      <View style={pinnedStyles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.small, { fontWeight: '700', color: colors.textStrong }]} numberOfLines={1}>
            {series.key}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 1 }]}>
            {'Dernier : '}
            <Text style={{ color: isOut ? colors.danger : colors.textStrong, fontVariant: ['tabular-nums'] }}>
              {series.lastVal.toFixed(2)}
            </Text>
            {` ${series.unit}`}
            {series.refMin < series.refMax ? ` · plage ${series.refMin}–${series.refMax}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={onUnpin}
          accessibilityLabel={`Désépingler ${series.key}`}
          style={pinnedStyles.unpinBtn}
        >
          <Ionicons name="pin" size={12} color={colors.primary} />
          <Text style={pinnedStyles.unpinText}>Épinglé</Text>
        </Pressable>
      </View>
      <PinnedMiniChart points={series.points} refMin={series.refMin} refMax={series.refMax} id={series.key} />
    </View>
  );
}

const pinnedStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 12,
    paddingBottom: 8,
    marginBottom: 10,
    ...elevation[1],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: spacing[2],
  },
  unpinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgBlue,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  unpinText: { fontSize: 11, fontWeight: '600', color: colors.primary },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();

  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [magnitudeData, setMagnitudeData] = useState<HealthMagnitudeDataPoint[]>([]);
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const load = useCallback(async () => {
    if (!bundle) return;
    try {
      const [a, p, mag, pinned] = await Promise.all([
        bundle.getAnalyses.execute(),
        bundle.retrieveUserProfileUseCase.execute(),
        bundle.calculateHealthMagnitudeUseCase.execute(),
        bundle.getPinnedMetricsUseCase.execute(),
      ]);
      setAnalyses(a);
      setProfile(p);
      setMagnitudeData(mag);
      setPinnedKeys(pinned);
    } finally {
      setLoading(false);
    }
  }, [bundle]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleUnpin = useCallback(async (key: string) => {
    if (!bundle) return;
    const updated = pinnedKeys.filter(k => k !== key);
    setPinnedKeys(updated);
    await bundle.savePinnedMetricsUseCase.execute(updated);
  }, [bundle, pinnedKeys]);

  // Build pinned series from analyses + ref ranges (getReferenceRange already initialized by calculateHealthMagnitude)
  const pinnedSeries = useMemo<PinnedSeries[]>(() => {
    if (!bundle || pinnedKeys.length === 0 || analyses.length === 0) return [];
    const sorted = [...analyses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return pinnedKeys.flatMap(key => {
      const points = sorted.flatMap(a => {
        const lv = a[key] as LabValue | undefined;
        if (typeof lv?.value !== 'number') return [];
        return [{ t: new Date(a.date).getTime(), v: lv.value }];
      });
      if (points.length === 0) return [];

      const lastA = [...sorted].reverse().find(a => typeof (a[key] as LabValue | undefined)?.value === 'number')!;
      const range = bundle.getReferenceRangeUseCase.execute(key, lastA.date);
      const unit = (lastA[key] as LabValue).unit;
      const lastVal = points[points.length - 1].v;

      return [{ key, unit, refMin: range?.min ?? 0, refMax: range?.max ?? 0, points, lastVal }];
    });
  }, [bundle, pinnedKeys, analyses]);

  const gradientAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, SHRINK_RANGE], [0, -SHRINK_RANGE], Extrapolation.CLAMP) },
    ],
  }));

  const wordmarkAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SHRINK_RANGE * 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  const expandedHeroAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, SHRINK_RANGE * 0.7], [1, 0], Extrapolation.CLAMP),
  }));

  const stickyHeaderAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [SHRINK_RANGE * 0.5, SHRINK_RANGE], [0, 1], Extrapolation.CLAMP),
  }));

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const displayName = profile?.firstName ?? 'vous';
  const age = profile ? (bundle?.getUserAgeUseCase.execute(profile) ?? '—') : null;
  const avatarName = profile?.name ?? (profile ? `${profile.firstName} ${profile.lastName}` : undefined);
  const sexLetter = profile?.gender === 'female' ? 'F' : profile?.gender === 'male' ? 'M' : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Hero gradient — anchored top, translates upward with scroll (parallax) */}
      <Animated.View
        pointerEvents="none"
        collapsable={false}
        renderToHardwareTextureAndroid
        style={[styles.gradientWrap, gradientAnimStyle]}
      >
        <LinearGradient
          colors={[
            'rgba(44,123,229,0.72)',
            'rgba(44,123,229,0.52)',
            'rgba(44,123,229,0.28)',
            'rgba(44,123,229,0.10)',
            'rgba(248,249,250,0.0)',
          ]}
          locations={[0, 0.14, 0.38, 0.62, 0.88]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {analyses.length === 0 ? (
        <>
          <View style={styles.wordmarkRow}>
            <HemeaWordmark size={26} />
          </View>
          <View style={styles.emptyState}>
            <PersonAvatar name={avatarName} size={56} imageUri={profile?.profileImage} />
            <View style={styles.emptyText}>
              <Text style={[styles.heroName, { fontSize: 24 }]}>{displayName}</Text>
              <Text style={[typography.h3, styles.emptyTitle]}>Aucune analyse</Text>
              <Text style={[typography.body, styles.emptyBody]}>
                Importez un bilan sanguin pour commencer.
              </Text>
            </View>
            <PrimaryButton onPress={() => router.push('/upload')} size="md">
              Importer un PDF
            </PrimaryButton>
          </View>
        </>
      ) : (
        <>
          <Animated.ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
          >
            <Animated.View style={[styles.wordmarkRow, wordmarkAnimStyle]} pointerEvents="none">
              <HemeaWordmark size={26} />
            </Animated.View>

            <Animated.View style={[styles.expandedHero, expandedHeroAnimStyle]}>
              <PersonAvatar name={avatarName} size={104} imageUri={profile?.profileImage} />
              <View style={styles.expandedHeroText}>
                <Text style={styles.helloText}>Bonjour,</Text>
                <Text style={styles.heroName}>{displayName}</Text>
                {profile && age !== null && (
                  <Text style={styles.metaText}>
                    <Text style={{ color: colors.textStrong, fontWeight: '700' }}>{age}</Text>
                    {' ans'}
                    {sexLetter && (
                      <>
                        {' · '}
                        <Text style={{ color: colors.textStrong, fontWeight: '700' }}>{sexLetter}</Text>
                      </>
                    )}
                    {' · '}
                    <Text style={{ color: colors.textStrong, fontWeight: '700' }}>{analyses.length}</Text>
                    {' analyses'}
                  </Text>
                )}
              </View>
            </Animated.View>

            {magnitudeData.length > 0 && (
              <BalanceCard data={magnitudeData} />
            )}

            <Pressable
              onPress={() => router.push('/analyses')}
              style={({ pressed }) => [styles.analysesCta, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={styles.ctaIcon}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.ctaText}>
                <Text style={[typography.lead, { color: colors.textStrong }]}>Mes analyses</Text>
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                  {analyses.length} bilans importés
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <View style={styles.pinnedHeader}>
              <Text style={[typography.label]}>Graphiques épinglés</Text>
              <Pressable onPress={() => router.push('/(tabs)/charts')}>
                <Text style={styles.seeAllText}>Tous les graphiques</Text>
              </Pressable>
            </View>

            {pinnedSeries.length === 0 ? (
              <View style={styles.emptyPinned}>
                <Text style={[typography.small, { color: colors.textBody, textAlign: 'center', marginBottom: 8 }]}>
                  Aucun graphique épinglé. Épinglez vos marqueurs préférés depuis l&apos;onglet Graphiques.
                </Text>
                <PrimaryButton size="sm" variant="ghost" onPress={() => router.push('/(tabs)/charts')}>
                  Parcourir les graphiques
                </PrimaryButton>
              </View>
            ) : (
              pinnedSeries.map(series => (
                <PinnedChartCard key={series.key} series={series} onUnpin={() => handleUnpin(series.key)} />
              ))
            )}
          </Animated.ScrollView>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.stickyHeader,
              { top: insets.top, height: STICKY_HEADER_HEIGHT },
              stickyHeaderAnimStyle,
            ]}
          >
            <PersonAvatar name={avatarName} size={40} imageUri={profile?.profileImage} />
            <View style={styles.stickyText}>
              <Text style={styles.stickyName} numberOfLines={1}>{displayName}</Text>
              {profile && age !== null && (
                <Text style={styles.stickyMeta} numberOfLines={1}>
                  {age} ans
                  {sexLetter && ` · ${sexLetter}`}
                  {' · '}
                  {analyses.length} analyses
                </Text>
              )}
            </View>
          </Animated.View>
        </>
      )}

      <View
        pointerEvents="box-none"
        style={[styles.settingsFabSlot, { top: insets.top + 10 }]}
      >
        <GlassFAB size={40} onPress={() => router.push('/settings')} accessibilityLabel="Réglages">
          <Ionicons name="settings-outline" size={18} color={colors.textStrong} />
        </GlassFAB>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  gradientWrap: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    height: 580,
    zIndex: 0,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: WORDMARK_ROW_HEIGHT,
    paddingTop: 8,
  },
  expandedHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingTop: 24,
    paddingBottom: 32,
    paddingRight: 50,
  },
  expandedHeroText: { flex: 1, minWidth: 0, gap: 2 },
  helloText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textBody,
    lineHeight: 18,
  },
  heroName: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.textStrong,
    letterSpacing: -0.6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textStrong,
    marginTop: 4,
  },
  stickyHeader: {
    position: 'absolute',
    left: spacing[5],
    right: spacing[5] + 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 3,
  },
  stickyText: { flex: 1, minWidth: 0, justifyContent: 'center' },
  stickyName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textStrong,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  stickyMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textBody,
    marginTop: 2,
  },
  settingsFabSlot: {
    position: 'absolute',
    right: spacing[5],
    zIndex: 4,
  },
  scroll: { flex: 1, zIndex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  analysesCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...elevation[1],
  },
  ctaIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.lg,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { flex: 1 },
  pinnedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyPinned: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
  },
  emptyText: { alignItems: 'center', gap: spacing[1] },
  emptyTitle: { textAlign: 'center', marginTop: spacing[2] },
  emptyBody: { textAlign: 'center', color: colors.textBody },
});
