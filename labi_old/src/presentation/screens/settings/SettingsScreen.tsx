import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../../components/ScreenLayout";
import { colorPalette } from "../../../config/themes";

type SettingSectionProps = {
  title: string;
  items: SettingItemProps[];
};

type SettingItemProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  chevron?: boolean;
};

export const SettingsScreen: React.FC = () => {
  const router = useRouter();

  const navigateToProfile = () => router.push("/(tabs)/settings/profile");
  const navigateToDeviceSync = () => router.push("/(tabs)/settings/sync");
  const navigateToApiKeySettings = () => router.push("/(tabs)/settings/api-key");
  const navigateToDatabaseSettings = () => router.push("/(tabs)/settings/database");
  const navigateToHelpCenter = () => router.push("/(tabs)/settings/help");
  const navigateToPrivacySecurity = () => router.push("/(tabs)/settings/privacy");
  const navigateToAbout = () => router.push("/(tabs)/settings/about");

  const createProfileSection = (): SettingSectionProps => ({
    title: "Profile",
    items: [
      { title: "User Profile", icon: "person-outline", onPress: navigateToProfile },
      { title: "Device Sync", icon: "sync-outline", onPress: navigateToDeviceSync },
    ],
  });

  const createConfigurationSection = (): SettingSectionProps => ({
    title: "Configuration",
    items: [
      { title: "API Key Settings", icon: "key-outline", onPress: navigateToApiKeySettings },
      { title: "Database Settings", icon: "server-outline", onPress: navigateToDatabaseSettings },
    ],
  });

  const createSupportSection = (): SettingSectionProps => ({
    title: "Support",
    items: [
      { title: "Help Center", icon: "help-circle-outline", onPress: navigateToHelpCenter },
      { title: "Privacy & Security", icon: "shield-outline", onPress: navigateToPrivacySecurity },
      { title: "About", icon: "information-circle-outline", onPress: navigateToAbout },
    ],
  });

  return (
    <ScreenLayout scrollable={true} showHeader={false} showSettingsButton={false}>
      <View style={styles.contentWrapper}>
        <SettingSection {...createProfileSection()} />
        <SettingSection {...createConfigurationSection()} />
        <SettingSection {...createSupportSection()} />
      </View>
    </ScreenLayout>
  );
};

const SettingItem: React.FC<SettingItemProps> = ({ title, icon, onPress, chevron = true }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemContent}>
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={colorPalette.primary.main} style={styles.settingIcon} />
        <Text style={styles.settingItemText}>{title}</Text>
      </View>
      {chevron && (
        <Ionicons name="chevron-forward" size={18} color={colorPalette.neutral.light} />
      )}
    </View>
  </TouchableOpacity>
);

const SettingSection: React.FC<SettingSectionProps> = ({ title, items }) => (
  <View style={styles.settingSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {items.map((item, index) => (
        <React.Fragment key={item.title}>
          <SettingItem {...item} />
          {index < items.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  contentWrapper: { flex: 1, padding: 20 },
  settingSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: colorPalette.neutral.main },
  sectionContent: {
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  settingItem: { padding: 16 },
  settingItemContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  settingItemLeft: { flexDirection: "row", alignItems: "center" },
  settingIcon: { marginRight: 12 },
  settingItemText: { fontSize: 16, color: colorPalette.neutral.main },
  divider: { height: 1, backgroundColor: colorPalette.neutral.lighter, marginHorizontal: 16 },
});
