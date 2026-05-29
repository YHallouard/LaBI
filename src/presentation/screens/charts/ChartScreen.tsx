import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle, Path, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';

import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { ReferenceRange } from '../../../domain/services/ReferenceRangeCalculator';
import { useUseCases } from '../../contexts/UseCasesContext';
import { LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS, LAB_VALUE_EXPLANATIONS } from '../../../config/LabConfig';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, StatCard,
} from '../../../design-system';
import { BlurView } from 'expo-blur';
import { GlassFAB } from '../../../design-system/components/GlassFAB';
import { GlassSurface } from '../../../design-system/components/GlassSurface';
import { BottomSheet } from '../../../design-system/components/BottomSheet';

// ─── Time range definitions ───────────────────────────────────────────────────
type RangeKey = '3M' | '6M' | '1Y' | '3Y' | 'Tout';
const RANGES: { key: RangeKey; label: string; months: number | null }[] = [
  { key: '3M', label: '3M', months: 3 },
  { key: '6M', label: '6M', months: 6 },
  { key: '1Y', label: '1 an', months: 12 },
  { key: '3Y', label: '3 ans', months: 36 },
  { key: 'Tout', label: 'Tout', months: null },
];

function filterByRange(analyses: BiologicalAnalysis[], range: RangeKey): BiologicalAnalysis[] {
  const r = RANGES.find(r => r.key === range);
  if (!r || r.months === null) return analyses;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - r.months);
  return analyses.filter(a => new Date(a.date) >= cutoff);
}

// ─── SimpleChart ─────────────────────────────────────────────────────────────
function SimpleChart({
  points,
  refMin,
  refMax,
  marker,
}: {
  points: { v: number; t: number; label: string }[];
  refMin?: number;
  refMax?: number;
  marker: string;
}) {
  if (points.length < 2) return null;
  const W = 320, H = 130;
  const pad = { l: 28, r: 12, t: 10, b: 22 };
  const values = points.map(p => p.v);
  const dataMin = Math.min(...values, refMin ?? Infinity);
  const dataMax = Math.max(...values, refMax ?? -Infinity);
  const vMin = dataMin * 0.92;
  const vMax = dataMax * 1.08 || 1;
  const minT = Math.min(...points.map(p => p.t));
  const maxT = Math.max(...points.map(p => p.t));
  const xOf = (t: number) => pad.l + ((t - minT) / (maxT - minT || 1)) * (W - pad.l - pad.r);
  const yOf = (v: number) => H - pad.b - ((v - vMin) / (vMax - vMin)) * (H - pad.t - pad.b);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.t).toFixed(1)} ${yOf(p.v).toFixed(1)}`).join(' ');
  const bandTop = refMax != null ? yOf(refMax) : null;
  const bandBot = refMin != null ? yOf(refMin) : null;
  const svgId = `band-${marker.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const labelIdxs = [0, Math.floor(points.length / 2), points.length - 1].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id={svgId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#00C800" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#00C800" stopOpacity="0.04" />
        </SvgGradient>
      </Defs>
      {[0, 0.33, 0.66, 1].map((f, i) => (
        <Line key={i}
          x1={pad.l} x2={W - pad.r}
          y1={pad.t + f * (H - pad.t - pad.b)}
          y2={pad.t + f * (H - pad.t - pad.b)}
          stroke={colors.chartGrid} strokeWidth="1"
        />
      ))}
      {bandTop != null && bandBot != null && (
        <Rect x={pad.l} y={bandTop} width={W - pad.l - pad.r} height={Math.max(0, bandBot - bandTop)} fill={`url(#${svgId})`} />
      )}
      <Path d={pathD} fill="none" stroke={colors.chartLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const out = (refMin != null && p.v < refMin) || (refMax != null && p.v > refMax);
        return (
          <Circle key={i} cx={xOf(p.t)} cy={yOf(p.v)} r={out ? 4.5 : 4} fill={out ? colors.danger : colors.primary} stroke="#fff" strokeWidth="1.5" />
        );
      })}
      <SvgText fontSize="9" fill={colors.chartAxisLabel} textAnchor="end" x={pad.l - 4} y={pad.t + 4}>{vMax.toFixed(1)}</SvgText>
      <SvgText fontSize="9" fill={colors.chartAxisLabel} textAnchor="end" x={pad.l - 4} y={H - pad.b + 3}>{vMin.toFixed(1)}</SvgText>
      {labelIdxs.map(i => (
        <SvgText key={i} fontSize="9" fill={colors.chartAxisLabel} textAnchor="middle" x={xOf(points[i].t)} y={H - 6}>
          {points[i].label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── MarkerSection ────────────────────────────────────────────────────────────
type MarkerEntry = { key: string; label: string; unit: string; refMin?: number; refMax?: number };

function buildPoints(analyses: BiologicalAnalysis[], key: string) {
  return analyses
    .filter(a => {
      const v = a[key];
      return v != null && typeof v === 'object' && typeof (v as LabValue).value === 'number';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(a => {
      const lv = a[key] as LabValue;
      return {
        v: lv.value as number,
        t: new Date(a.date).getTime(),
        label: new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      };
    });
}

function MarkerSection({
  entry,
  points,
  refMin,
  refMax,
  pinned,
  onTogglePin,
  onOpenInfo,
}: {
  entry: MarkerEntry;
  points: { v: number; t: number; label: string }[];
  refMin?: number;
  refMax?: number;
  pinned: boolean;
  onTogglePin: () => void;
  onOpenInfo: () => void;
}) {
  if (points.length === 0) return null;

  const last = points[points.length - 1].v;
  const isAlert = (refMin != null && last < refMin) || (refMax != null && last > refMax);
  const values = points.map(p => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  return (
    <View style={markerStyles.card}>
      <View style={markerStyles.header}>
        <Pressable onPress={onOpenInfo} hitSlop={6} style={markerStyles.titleBlock}>
          <View style={markerStyles.titleRow}>
            <Text style={[typography.lead, { color: colors.textStrong }]} numberOfLines={1}>
              {entry.label}
            </Text>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
          </View>
          <Text style={[typography.caption, { color: isAlert ? colors.danger : colors.textFaint, marginTop: 1 }]}>
            {last.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {entry.unit}
            {refMin != null && refMax != null ? ` · plage ${refMin}–${refMax}` : ''}
          </Text>
        </Pressable>

        <Pressable
          onPress={onTogglePin}
          accessibilityLabel={pinned ? `Désépingler ${entry.key}` : `Épingler ${entry.key}`}
          style={[markerStyles.pinBtn, pinned && markerStyles.pinBtnActive]}
        >
          <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={13} color={pinned ? colors.primary : colors.textFaint} />
          <Text style={[markerStyles.pinText, { color: pinned ? colors.primary : colors.textFaint }]}>
            {pinned ? 'Épinglé' : 'Épingler'}
          </Text>
        </Pressable>
      </View>

      <View style={markerStyles.statsRow}>
        <StatCard label="Min" value={min.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} unit={entry.unit} />
        <StatCard label="Moy" value={avg.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} unit={entry.unit} />
        <StatCard label="Max" value={max.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} unit={entry.unit} alert={isAlert} />
      </View>
      <View style={markerStyles.chartWrap}>
        <SimpleChart points={points} refMin={refMin} refMax={refMax} marker={entry.key} />
      </View>
    </View>
  );
}

const markerStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    marginBottom: spacing[3],
    overflow: 'hidden',
    ...elevation[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[2],
  },
  titleBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  pinBtnActive: {
    backgroundColor: colors.bgBlue,
    borderColor: colors.bgBlue,
  },
  pinText: { fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[4], marginBottom: spacing[3] },
  chartWrap: { paddingHorizontal: spacing[4], paddingBottom: spacing[4] },
});

// ─── ChartScreen ──────────────────────────────────────────────────────────────
export function ChartScreen() {
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();

  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [refRanges, setRefRanges] = useState<Record<string, ReferenceRange>>({});
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('1Y');
  const [pillOpen, setPillOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [infoMarker, setInfoMarker] = useState<{ key: string; unit: string; refMin?: number; refMax?: number } | null>(null);
  const pillAnim = useState(() => new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      if (!bundle) return;
      const load = async () => {
        const [a, pinned] = await Promise.all([
          bundle.getAnalyses.execute(),
          bundle.getPinnedMetricsUseCase.execute(),
          bundle.getReferenceRangeUseCase.initialize(),
        ]);
        setAnalyses(a);
        setPinnedKeys(pinned);
        const now = new Date();
        const ranges: Record<string, ReferenceRange> = {};
        Object.values(LAB_VALUE_CATEGORIES).flat().forEach(key => {
          ranges[key] = bundle.getReferenceRangeUseCase.execute(key, now);
        });
        setRefRanges(ranges);
        setLoading(false);
      };
      load();
    }, [bundle]),
  );

  const handleTogglePin = useCallback(async (key: string) => {
    if (!bundle) return;
    const updated = pinnedKeys.includes(key)
      ? pinnedKeys.filter(k => k !== key)
      : [...pinnedKeys, key];
    setPinnedKeys(updated);
    await bundle.savePinnedMetricsUseCase.execute(updated);
  }, [bundle, pinnedKeys]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const filtered = filterByRange(analyses, range);
  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const q = query.trim().toLowerCase();
  const matchesQuery = (key: string) => {
    if (!q) return true;
    if (key.toLowerCase().includes(q)) return true;
    const info = LAB_VALUE_EXPLANATIONS[key];
    return !!info && info.toLowerCase().includes(q);
  };

  const categories = Object.entries(LAB_VALUE_CATEGORIES)
    .map(([catLabel, markerKeys]) => ({
      id: catLabel,
      label: catLabel,
      markers: (markerKeys as string[])
        .filter(key => matchesQuery(key))
        .map(key => ({
          key,
          unit: LAB_VALUE_UNITS[key] ?? '',
          refMin: refRanges[key]?.min,
          refMax: refRanges[key]?.max,
          points: buildPoints(sorted, key),
        }))
        .filter(m => m.points.length > 0),
    }))
    .filter(cat => cat.markers.length > 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Graphiques" subtitle="Évolution dans le temps" />

      {/* Glass FAB — icon-only, toggles pill picker */}
      <View style={[styles.rangeFab, { top: insets.top + 14 }]}>
        <GlassFAB
          size={40}
          onPress={() => {
            const opening = !pillOpen;
            setPillOpen(opening);
            Animated.spring(pillAnim, {
              toValue: opening ? 1 : 0,
              useNativeDriver: true,
              friction: 8,
              tension: 100,
            }).start();
          }}
          accessibilityLabel="Plage temporelle"
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
        </GlassFAB>
      </View>

      {/* Backdrop blur when pill is open — covers entire screen */}
      {pillOpen && (
        <Pressable
          style={[StyleSheet.absoluteFill, { top: -insets.top, zIndex: 4 }]}
          onPress={() => {
            setPillOpen(false);
            Animated.spring(pillAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
          }}
        >
          <BlurView
            intensity={12}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        </Pressable>
      )}
      <Animated.View
        pointerEvents={pillOpen ? 'auto' : 'none'}
        style={[
          styles.pillContainer,
          { top: insets.top + 60 },
          {
            opacity: pillAnim,
            transform: [
              { scale: pillAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              { translateY: pillAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            ],
          },
        ]}
      >
        <GlassSurface radius={radii.xl} borderColor="rgba(255,255,255,0.75)" style={styles.pillInner}>
          {RANGES.map(r => (
            <Pressable
              key={r.key}
              onPress={() => {
                setRange(r.key);
                setPillOpen(false);
                Animated.spring(pillAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
              }}
              style={[styles.pillOption, r.key === range && styles.pillOptionActive]}
            >
              <Text style={[styles.pillOptionText, r.key === range && styles.pillOptionTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </GlassSurface>
      </Animated.View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un marqueur…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <View style={styles.clearBtn}>
              <Ionicons name="close" size={10} color={colors.primary} />
            </View>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <View style={styles.emptySearch}>
            <Text style={[typography.small, { fontWeight: '600', color: colors.textStrong, marginBottom: 4 }]}>
              Aucun résultat
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
              Essayez un autre terme. La recherche couvre les titres et descriptions.
            </Text>
          </View>
        ) : (
          categories.map(cat => (
            <View key={cat.id} style={styles.categoryBlock}>
              <Text style={[typography.label, styles.catLabel]}>{cat.label}</Text>
              {cat.markers.map(m => (
                <MarkerSection
                  key={m.key}
                  entry={{ key: m.key, label: m.key, unit: m.unit, refMin: m.refMin, refMax: m.refMax }}
                  points={m.points}
                  refMin={m.refMin}
                  refMax={m.refMax}
                  pinned={pinnedKeys.includes(m.key)}
                  onTogglePin={() => handleTogglePin(m.key)}
                  onOpenInfo={() => setInfoMarker({ key: m.key, unit: m.unit, refMin: m.refMin, refMax: m.refMax })}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Marker info glass BottomSheet */}
      <BottomSheet visible={infoMarker !== null} onClose={() => setInfoMarker(null)}>
        <View style={styles.infoSheet}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.label}>À propos du marqueur</Text>
              <Text style={[typography.h3, { letterSpacing: -0.1 }]} numberOfLines={1}>
                {infoMarker?.key ?? ''}
              </Text>
            </View>
          </View>

          <Text style={[typography.body, { color: colors.textBody, lineHeight: 22, marginBottom: spacing[4] }]}>
            {infoMarker ? (LAB_VALUE_EXPLANATIONS[infoMarker.key] ?? 'Aucune description disponible.') : ''}
          </Text>

          {infoMarker?.refMin != null && infoMarker?.refMax != null && (
            <View style={styles.infoRange}>
              <Text style={[typography.small, { fontWeight: '600', color: colors.textBody }]}>Plage normale</Text>
              <Text style={[typography.small, { fontWeight: '700', color: colors.textStrong, fontVariant: ['tabular-nums'] }]}>
                {infoMarker.refMin} – {infoMarker.refMax} {infoMarker.unit}
              </Text>
            </View>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing[3] }]}>
            Information à but pédagogique. Pour toute question médicale, consultez un professionnel.
          </Text>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  rangeFab: {
    position: 'absolute',
    right: 18,
    zIndex: 5,
  },
  pillContainer: {
    position: 'absolute' as const,
    right: 18,
    zIndex: 6,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  pillInner: {
    flexDirection: 'column' as const,
    padding: 5,
    gap: 2,
  },
  pillOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  pillOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  pillOptionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textBody,
  },
  pillOptionTextActive: {
    fontWeight: '700' as const,
    color: colors.primary,
  },
  infoSheet: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[8],
  },
  infoHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: spacing[4],
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: colors.bgBlue,
    borderWidth: 1,
    borderColor: colors.primary + '25',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  infoRange: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.bgBlue,
    borderWidth: 1,
    borderColor: colors.primary + '25',
    borderRadius: radii.lg,
    padding: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    ...elevation[1],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[1] },
  categoryBlock: { marginBottom: spacing[5] },
  catLabel: { paddingBottom: spacing[2], paddingTop: spacing[3] },
  emptySearch: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 24,
    marginTop: spacing[2],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
  },
});
