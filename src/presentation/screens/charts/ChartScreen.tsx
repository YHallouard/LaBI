import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Line, Circle, Path, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';

import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { ReferenceRange } from '../../../domain/services/ReferenceRangeCalculator';
import { useUseCases } from '../../contexts/UseCasesContext';
import { LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS, LAB_VALUE_EXPLANATIONS } from '../../../config/LabConfig';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, StatCard,
} from '../../../design-system';

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

// ─── MarkerInfoSheet ──────────────────────────────────────────────────────────
type InfoSheetMarker = { key: string; unit: string; refMin?: number; refMax?: number };

function MarkerInfoSheet({ marker, onClose }: { marker: InfoSheetMarker; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const info = LAB_VALUE_EXPLANATIONS[marker.key];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFillObject} />
      </Pressable>
      <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {/* Grabber */}
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIconRow}>
              <View style={styles.sheetIcon}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.label, { marginBottom: 2 }]}>À propos du marqueur</Text>
                <Text style={[typography.h2, { letterSpacing: -0.1 }]}>{marker.key}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Ionicons name="close" size={16} color={colors.textBody} />
            </Pressable>
          </View>

          {/* Info text */}
          {info ? (
            <Text style={[typography.body, styles.sheetBody]}>{info}</Text>
          ) : (
            <Text style={[typography.small, { color: colors.textBody }]}>
              Aucune information disponible pour ce marqueur.
            </Text>
          )}

          {/* Reference range */}
          {marker.refMin != null && marker.refMax != null && (
            <View style={styles.rangeRow}>
              <Text style={[typography.small, { fontWeight: '600', color: colors.textBody }]}>Plage normale</Text>
              <Text style={[typography.small, { fontWeight: '700', color: colors.textStrong, fontVariant: ['tabular-nums'] }]}>
                {marker.refMin} – {marker.refMax} {marker.unit}
              </Text>
            </View>
          )}

          {/* Disclaimer */}
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 12 }]}>
            Information à but pédagogique. Pour toute question médicale, consultez un professionnel.
          </Text>
        </Pressable>
      </View>
    </Modal>
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
  const [fabOpen, setFabOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [infoMarker, setInfoMarker] = useState<InfoSheetMarker | null>(null);

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

      {/* Glass FAB pill — time range picker */}
      <Pressable
        onPress={() => setFabOpen(o => !o)}
        style={[styles.rangeFab, { top: insets.top + 14 }]}
      >
        <BlurView intensity={60} tint="systemUltraThinMaterialLight" style={styles.rangeFabBlur}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text style={styles.rangeFabLabel}>{RANGES.find(r => r.key === range)?.label ?? range}</Text>
          <Ionicons name={fabOpen ? 'chevron-up' : 'chevron-down'} size={11} color={colors.primary} />
        </BlurView>
      </Pressable>

      {/* Popover */}
      {fabOpen && (
        <>
          <Pressable style={styles.rangeScrim} onPress={() => setFabOpen(false)} />
          <View style={[styles.rangePopover, { top: insets.top + 58 }]}>
            {RANGES.map(r => (
              <Pressable
                key={r.key}
                onPress={() => { setRange(r.key); setFabOpen(false); }}
                style={[styles.rangeOption, r.key === range && styles.rangeOptionActive]}
              >
                <Text style={[styles.rangeOptionText, r.key === range && styles.rangeOptionTextActive]}>
                  {r.label}
                </Text>
                {r.key === range && (
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}

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

      {/* MarkerInfoSheet */}
      {infoMarker && (
        <MarkerInfoSheet marker={infoMarker} onClose={() => setInfoMarker(null)} />
      )}
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
  rangeFabBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  rangeFabLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: -0.1,
  },
  rangeScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  rangePopover: {
    position: 'absolute',
    right: 18,
    zIndex: 7,
    minWidth: 120,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 20,
  },
  rangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  rangeOptionActive: {
    backgroundColor: colors.bgBlue,
  },
  rangeOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  rangeOptionTextActive: {
    fontWeight: '700' as const,
    color: colors.primary,
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
  // MarkerInfoSheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    paddingTop: 8,
    paddingHorizontal: spacing[5],
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 20,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  sheetIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sheetIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheetBody: {
    color: colors.textBody,
    lineHeight: 22,
    marginBottom: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgBlue,
    borderRadius: radii.lg,
    padding: 12,
    marginTop: 4,
  },
});
