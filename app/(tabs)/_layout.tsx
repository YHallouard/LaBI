import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  NativeTabs,
  Label,
  Icon,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassSurface } from "../../src/presentation/components/glass/GlassSurface";
import { glass, colorPalette } from "../../src/config/themes";

function UploadFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.fabWrapper,
        { bottom: (insets.bottom || 20) + 64 },
      ]}
      pointerEvents="box-none"
    >
      <GlassSurface
        intensity={glass.blur.thick}
        tint="systemChromeMaterial"
        radius={glass.radii.pill}
        overlayColor={glass.overlay.light}
        style={styles.fabSurface}
      >
        <TouchableOpacity
          onPress={() => router.push("/upload")}
          style={styles.fabTouchable}
          accessibilityLabel="Upload analysis"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color={colorPalette.primary.main} />
        </TouchableOpacity>
      </GlassSurface>
    </View>
  );
}

export default function TabLayout() {
  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon
            sf="house.fill"
            androidSrc={
              <VectorIcon family={MaterialCommunityIcons} name="home" />
            }
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="charts">
          <Label>Charts</Label>
          <Icon
            sf="chart.xyaxis.line"
            androidSrc={
              <VectorIcon family={MaterialCommunityIcons} name="chart-line" />
            }
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <Label>Settings</Label>
          <Icon
            sf="gear"
            androidSrc={
              <VectorIcon family={MaterialCommunityIcons} name="cog" />
            }
          />
        </NativeTabs.Trigger>
      </NativeTabs>
      <UploadFab />
    </>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: "absolute",
    right: 20,
    zIndex: 100,
    shadowColor: colorPalette.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  fabSurface: {
    borderRadius: glass.radii.pill,
  },
  fabTouchable: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
});
