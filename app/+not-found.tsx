import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, typography } from '../src/design-system';

export default function NotFoundScreen() {
  return (
    <View style={styles.root}>
      <Text style={typography.h2}>Page introuvable</Text>
      <Link href="/" style={styles.link}>
        <Text style={[typography.body, { color: colors.primary }]}>Retour à l'accueil</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: spacing[4] },
  link: { marginTop: spacing[3] },
});
