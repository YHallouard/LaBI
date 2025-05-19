import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
} from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "../components/AppImage";
import { APP_VERSION } from "../../utils/appVersion";
import { colorPalette } from "../../config/themes";

export const AboutScreen: React.FC = () => {
  const handleLinkedInPress = () => {
    Linking.openURL("https://www.linkedin.com/in/yann-hallouard/");
  };

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <AppImage
                imagePath="adaptive-icon"
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.title}>About Héméa</Text>

          <View style={styles.infoSection}>
            <Ionicons
              name="code-outline"
              size={24}
              color={colorPalette.primary.main}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>License</Text>
            <Text style={styles.sectionText}>
              This application is distributed under the MIT License.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Ionicons
              name="person-outline"
              size={24}
              color={colorPalette.primary.main}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Developer</Text>
            <Text style={styles.sectionText}>Created by Yann HALLOUARD</Text>

            <TouchableOpacity
              style={styles.linkedinButton}
              onPress={handleLinkedInPress}
            >
              <Ionicons
                name="logo-linkedin"
                size={20}
                color="white"
                style={styles.linkedinIcon}
              />
              <Text style={styles.linkedinText}>Connect on LinkedIn</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={colorPalette.primary.main}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>About the App</Text>
            <Text style={styles.sectionText}>
              Héméa helps you track and visualize your laboratory analyses
              results over time, making it easier to monitor your health data.
            </Text>
          </View>

          <Text style={styles.versionText}>Version {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 30,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: colorPalette.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
    marginBottom: 30,
    textAlign: "center",
  },
  infoSection: {
    width: "100%",
    backgroundColor: colorPalette.neutral.background,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  sectionIcon: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colorPalette.neutral.main,
    marginBottom: 10,
    textAlign: "center",
  },
  sectionText: {
    fontSize: 16,
    color: colorPalette.neutral.light,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 15,
  },
  linkedinButton: {
    flexDirection: "row",
    backgroundColor: "#0077B5",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  linkedinIcon: {
    marginRight: 8,
  },
  linkedinText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  versionText: {
    fontSize: 14,
    color: colorPalette.neutral.light,
    marginTop: 10,
  },
});
