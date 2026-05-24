import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle, Path, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';

import { BiologicalAnalysis, LabValue } from '../../../domain/entities/BiologicalAnalysis';
import { ReferenceRange } from '../../../domain/services/ReferenceRangeCalculator';
import { useUseCases } from '../../contexts/UseCasesContext';
import { LAB_VALUE_CATEGORIES, LAB_VALUE_UNITS } from '../../../config/LabConfig';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, StatCard,
} from '../../../design-system';

type MarkerEntry = { key: string; label: string; unit: string; refMin?: number; refMax?: number };

function buildPoints(analyses: BiologicalAnalysis[], key: string) {
  return analyses
    .filter((a) => {
      const v = (a as any)[key];
      return v != null && typeof v === 'object' && typeof (v as LabValue).value === 'number';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((a) => {
      const lv = (a as any)[key] as LabValue;
      return {
        v: lv.value as number,
        t: new Date(a.date).getTime(),
        label: new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      };
    });
}

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
  const values = points.map((p) => p.v);
  const dataMin = Math.min(...values, refMin ?? Infinity);
  const dataMax = Math.max(...values, refMax ?? -Infinity);
  const vMin = dataMin * 0.92;
  const vMax = dataMax * 1.08 || 1;
  const minT = Math.min(...points.map((p) => p.t));
  const maxT = Math.max(...points.map((p) => p.t));

  const xOf = (t: number) => pad.l + ((t - minT) / (maxT - minT || 1)) * (W - pad.l - pad.r);
  const yOf = (v: number) => H - pad.b - ((v - vMin) / (vMax - vMin)) * (H - pad.t - pad.b);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.t).toFixed(1)} ${yOf(p.v).toFixed(1)}`).join(' ');
  const bandTop = refMax != null ? yOf(refMax) : null;
  const bandBot = refMin != null ? yOf(refMin) : null;
  const svgId = `band-${marker.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const labelIdxs = [0, Math.floor(points.length / 2), points.length - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  );

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
        <Rect
          x={pad.l} y={bandTop}
          width={W - pad.l - pad.r}
          height={Math.max(0, bandBot - bandTop)}
          fill={`url(#${svgId})`}
        />
      )}
      <Path d={pathD} fill="none" stroke={colors.chartLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const out = (refMin != null && p.v < refMin) || (refMax != null && p.v > refMax);
        return (
          <Circle key={i} cx={xOf(p.t)} cy={yOf(p.v)} r={out ? 4.5 : 4}
            fill={out ? colors.danger : colors.primary} stroke="#fff" strokeWidth="1.5"
          />
        );
      })}
      <SvgText fontSize="9" fill={colors.chartAxisLabel} textAnchor="end" x={pad.l - 4} y={pad.t + 4}>{vMax.toFixed(1)}</SvgText>
      <SvgText fontSize="9" fill={colors.chartAxisLabel} textAnchor="end" x={pad.l - 4} y={H - pad.b + 3}>{vMin.toFixed(1)}</SvgText>
      {labelIdxs.map((i) => (
        <SvgText key={i} fontSize="9" fill={colors.chartAxisLabel} textAnchor="middle" x={xOf(points[i].t)} y={H - 6}>
          {points[i].label}
        </SvgText>
      ))}
    </Svg>
  );
}

function MarkerSection({
  entry,
  points,
  refMin,
  refMax,
}: {
  entry: MarkerEntry;
  points: { v: number; t: number; label: string }[];
  refMin?: number;
  refMax?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (points.length === 0) return null;

  const last = points[points.length - 1].v;
  const isAlert = (refMin != null && last < refMin) || (refMax != null && last > refMax);
  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  return (
    <View style={styles.markerCard}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.markerHeader}>
        <View style={styles.markerTitleBlock}>
          <Text style={[typography.lead, { color: colors.textStrong }]}>{entry.label}</Text>
          <Text style={[typography.caption, { color: isAlert ? colors.danger : colors.textFaint }]}>
            {last.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {entry.unit}
            {refMin != null && refMax != null ? ` · plage ${refMin}–${refMax}` : ''}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {expanded && (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Min" value={min.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} unit={entry.unit} />
            <StatCard label="Moy" value={avg.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} unit={entry.unit} />
            <StatCard label="Max" value={max.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} unit={entry.unit} alert={isAlert} />
          </View>
          <View style={styles.chartWrap}>
            <SimpleChart points={points} refMin={refMin} refMax={refMax} marker={entry.key} />
          </View>
        </>
      )}
    </View>
  );
}

export function ChartScreen() {
  const insets = useSafeAreaInsets();
  const { bundle } = useUseCases();
  const [analyses, setAnalyses] = useState<BiologicalAnalysis[]>([]);
  const [refRanges, setRefRanges] = useState<Record<string, ReferenceRange>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!bundle) return;
      const load = async () => {
        const [a] = await Promise.all([
          bundle.getAnalyses.execute(),
          bundle.getReferenceRangeUseCase.initialize(),
        ]);
        setAnalyses(a);
        const now = new Date();
        const ranges: Record<string, ReferenceRange> = {};
        Object.values(LAB_VALUE_CATEGORIES).flat().forEach((key) => {
          ranges[key as string] = bundle.getReferenceRangeUseCase.execute(key as string, now);
        });
        setRefRanges(ranges);
        setLoading(false);
      };
      load();
    }, [bundle]),
  );

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const sorted = [...analyses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const categories = Object.entries(LAB_VALUE_CATEGORIES)
    .map(([catLabel, markerKeys]) => ({
      id: catLabel,
      label: catLabel,
      markers: (markerKeys as string[]).map((key) => ({
        key,
        label: key,
        refMin: refRanges[key]?.min,
        refMax: refRanges[key]?.max,
      })).map((m) => ({
        ...m,
        points: buildPoints(sorted, m.key),
      })).filter((m) => m.points.length > 0),
    }))
    .filter((cat) => cat.markers.length > 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Graphiques" subtitle="Vos marqueurs biologiques" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[typography.body, { textAlign: 'center', color: colors.textBody }]}>
              Importez des analyses pour voir vos graphiques.
            </Text>
          </View>
        ) : (
          categories.map((cat) => (
            <View key={cat.id} style={styles.categoryBlock}>
              <Text style={[typography.label, styles.catLabel]}>{cat.label}</Text>
              {cat.markers.map((m) => (
                <MarkerSection
                  key={m.key}
                  entry={{ key: m.key, label: m.label, unit: LAB_VALUE_UNITS[m.key] ?? '', refMin: m.refMin, refMax: m.refMax }}
                  points={m.points}
                  refMin={m.refMin}
                  refMax={m.refMax}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  emptyState: { paddingVertical: spacing[8], paddingHorizontal: spacing[4] },
  categoryBlock: { marginBottom: spacing[5] },
  catLabel: { paddingBottom: spacing[2], paddingTop: spacing[3] },
  markerCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    marginBottom: spacing[3],
    overflow: 'hidden',
    ...elevation[2],
  },
  markerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  markerTitleBlock: { flex: 1, gap: 3 },
  statsRow: { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[4], marginBottom: spacing[3] },
  chartWrap: { paddingHorizontal: spacing[4], paddingBottom: spacing[4] },
});
