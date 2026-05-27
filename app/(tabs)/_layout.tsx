import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/design-system/tokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Record<string, { label: string; active: IoniconName; inactive: IoniconName }> = {
  index: { label: 'Accueil', active: 'home', inactive: 'home-outline' },
  charts: { label: 'Graphiques', active: 'bar-chart', inactive: 'bar-chart-outline' },
};

export const TAB_BAR_HEIGHT = 72; // pill (~48) + bottom gap (24)

function GlassPillTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom + 6, 22);

  const pillContent = state.routes.map((route, index) => {
    const isFocused = state.index === index;
    const meta = TABS[route.name] ?? {
      label: route.name,
      active: 'ellipse' as IoniconName,
      inactive: 'ellipse-outline' as IoniconName,
    };

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        style={[styles.tab, isFocused && styles.tabActive]}
      >
        <Ionicons
          name={isFocused ? meta.active : meta.inactive}
          size={22}
          color={isFocused ? colors.primary : colors.textBody}
        />
        <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.textBody }]}>
          {meta.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View style={[styles.barContainer, { bottom }]} pointerEvents="box-none">
      {/* Shadow wrapper — separate from overflow:hidden to preserve shadow on iOS */}
      <View style={styles.pillShadow}>
        <View style={styles.pillClip}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={28} tint="systemUltraThinMaterialLight" style={styles.pillInner}>
              {pillContent}
            </BlurView>
          ) : (
            <View style={[styles.pillInner, styles.pillAndroid]}>{pillContent}</View>
          )}
        </View>
      </View>

      {/* Primary import FAB */}
      <Pressable
        onPress={() => router.push('/upload')}
        accessibilityLabel="Importer un PDF"
        accessibilityRole="button"
        style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.82 : 1 }]}
      >
        <Ionicons name="add" size={28} color={colors.textOnColor} />
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassPillTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="charts" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  pillShadow: {
    borderRadius: 9999,
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  pillClip: {
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 5,
  },
  pillAndroid: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  tab: {
    width: 78,
    paddingTop: 7,
    paddingBottom: 6,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#12263F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C7BE5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
});
