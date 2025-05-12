import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";

type SettingsScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "SettingsScreen">;
};

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

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const navigateToProfile = () => navigation.navigate("ProfileScreen");
  const navigateToApiKeySettings = () =>
    navigation.navigate("ApiKeySettingsScreen");
  const navigateToDatabaseSettings = () =>
    navigation.navigate("DatabaseSettingsScreen");
  const navigateToHelpCenter = () => navigation.navigate("HelpCenterScreen");
  const navigateToPrivacySecurity = () =>
    navigation.navigate("PrivacySecurityScreen");
  const navigateToAbout = () => navigation.navigate("AboutScreen");

  const createProfileSection = (): SettingSectionProps => ({
    title: "Profile",
    items: [
      {
        title: "User Profile",
        icon: "person-outline",
        onPress: navigateToProfile,
      },
    ],
  });

  const createConfigurationSection = (): SettingSectionProps => ({
    title: "Configuration",
    items: [
      {
        title: "API Key Settings",
        icon: "key-outline",
        onPress: navigateToApiKeySettings,
      },
      {
        title: "Database Settings",
        icon: "server-outline",
        onPress: navigateToDatabaseSettings,
      },
    ],
  });

  const createSupportSection = (): SettingSectionProps => ({
    title: "Support",
    items: [
      {
        title: "Help Center",
        icon: "help-circle-outline",
        onPress: navigateToHelpCenter,
      },
      {
        title: "Privacy & Security",
        icon: "shield-outline",
        onPress: navigateToPrivacySecurity,
      },
      {
        title: "About",
        icon: "information-circle-outline",
        onPress: navigateToAbout,
      },
    ],
  });

  return (
    <ScreenLayout>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentWrapper}>
          <SettingsHeader />
          <SettingSection {...createProfileSection()} />
          <SettingSection {...createConfigurationSection()} />
          <SettingSection {...createSupportSection()} />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const SettingsHeader = () => (
  <>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.description}>
      Configure your app settings and preferences
    </Text>
  </>
);

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  icon,
  onPress,
  chevron = true,
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemContent}>
      <View style={styles.settingItemLeft}>
        <Ionicons
          name={icon}
          size={22}
          color="#2c7be5"
          style={styles.settingIcon}
        />
        <Text style={styles.settingItemText}>{title}</Text>
      </View>
      {chevron && <Ionicons name="chevron-forward" size={18} color="#95aac9" />}
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
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#12263f",
  },
  description: {
    fontSize: 16,
    marginBottom: 25,
    color: "#5a7184",
  },
  settingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#12263f",
  },
  sectionContent: {
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  settingItem: {
    padding: 16,
  },
  settingItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingItemText: {
    fontSize: 16,
    color: "#12263f",
  },
  divider: {
    height: 1,
    backgroundColor: "#e3ebf6",
    marginHorizontal: 16,
  },
});
