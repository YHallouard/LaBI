import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  NativeTabs,
  Label,
  Icon,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation } from '../../src/design-system/tokens';
import { GlassSurface } from '../../src/design-system/components/GlassSurface';

function UploadFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.fabWrapper, { bottom: (insets.bottom || 20) + 64 }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => router.push('/upload')}
        accessibilityLabel="Importer un PDF"
        accessibilityRole="button"
        style={({ pressed }) => [styles.fabPressable, { opacity: pressed ? 0.82 : 1 }]}
      >
        <View style={styles.fabInner}>
          <Ionicons name="add" size={28} color={colors.textOnColor} />
        </View>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Accueil</Label>
          <Icon
            sf="house.fill"
            androidSrc={<VectorIcon family={MaterialCommunityIcons} name="home" />}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="charts">
          <Label>Graphiques</Label>
          <Icon
            sf="chart.xyaxis.line"
            androidSrc={<VectorIcon family={MaterialCommunityIcons} name="chart-line" />}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
      <UploadFab />
    </>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    ...elevation.fab,
  },
  fabPressable: {
    borderRadius: 999,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
