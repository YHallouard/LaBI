import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  colors, spacing,
  typography,
} from '../../../design-system';

export function UploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sheet grabber */}
      <View style={styles.grabber} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn} hitSlop={8}>
          <Text style={[typography.body, { color: colors.primary }]}>Annuler</Text>
        </Pressable>
        <Text style={[typography.lead, styles.headerTitle]}>Nouvelle analyse</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Text style={[typography.small, styles.subtitle]}>
          Choisissez votre méthode d&apos;import
        </Text>

        {/* ── AI import card ───────────────────────────────────────── */}
        <Pressable
          onPress={() => router.push('/upload/ai-import')}
          style={({ pressed }) => [styles.card, styles.cardAI, { opacity: pressed ? 0.85 : 1 }]}
        >

          <View style={styles.cardBody}>
            {/* Gradient icon */}
            <LinearGradient
              colors={['#2C7BE5', '#4FA3F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapAI}
            >
              <Ionicons name="scan" size={26} color={colors.textOnColor} />
            </LinearGradient>

            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Import par IA</Text>
              <Text style={[typography.small, { color: colors.textBody, marginTop: 4, lineHeight: 18 }]}>
                Glissez un PDF de bilan. Mistral AI extrait automatiquement la date et tous les marqueurs.
              </Text>
              {/* Feature tags */}
              <View style={styles.tagRow}>
                {['~20 s', 'PDF', 'Tous marqueurs'].map(tag => (
                  <View key={tag} style={styles.tagFilled}>
                    <Text style={styles.tagFilledText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Pressable>

        {/* ── Manual import card ───────────────────────────────────── */}
        <Pressable
          onPress={() => router.push('/upload/manual')}
          style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={styles.cardBody}>
            {/* Flat icon */}
            <View style={styles.iconWrapManual}>
              <Ionicons name="create-outline" size={26} color={colors.primary} />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Saisie manuelle</Text>
              <Text style={[typography.small, { color: colors.textBody, marginTop: 4, lineHeight: 18 }]}>
                Entrez vous-même chaque valeur. Idéal si vous n&apos;avez pas le PDF ou que vous ne souhaitez pas utiliser Mistral AI.
              </Text>
              {/* Border-style tags */}
              <View style={styles.tagRow}>
                {['Hors ligne', 'Sans clé API'].map(tag => (
                  <View key={tag} style={styles.tagOutline}>
                    <Text style={styles.tagOutlineText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Pressable>

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 4 }]}>
          Vos données restent sur votre appareil.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  cancelBtn: { width: 70 },
  headerTitle: { color: colors.textStrong, fontWeight: '700' },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[3],
  },
  subtitle: { color: colors.textBody },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAI: {
    shadowColor: '#2C7BE5',
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textOnColor,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 14,
  },
  iconWrapAI: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C7BE5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    flexShrink: 0,
  },
  iconWrapManual: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textStrong,
    letterSpacing: -0.1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagFilled: {
    backgroundColor: colors.bgBlue,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  tagFilledText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  tagOutline: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  tagOutlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textBody,
  },
});
