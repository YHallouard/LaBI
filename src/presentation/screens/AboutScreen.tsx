import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { AppImage } from "../components/AppImage";
import { APP_VERSION } from "../../utils/appVersion";

export const AboutScreen: React.FC = () => {
  const handleLinkedInPress = () => {
    Linking.openURL("https://www.linkedin.com/in/yann-hallouard/");
  };

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <AppImage
            imagePath="adaptive-icon"
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>About Héméa</Text>

          <View style={styles.infoSection}>
            <Ionicons
              name="code-outline"
              size={24}
              color="#2c7be5"
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
              color="#2c7be5"
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
              color="#2c7be5"
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#12263f",
    marginBottom: 30,
    textAlign: "center",
  },
  infoSection: {
    width: "100%",
    backgroundColor: "#f5f7fb",
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
    color: "#12263f",
    marginBottom: 10,
    textAlign: "center",
  },
  sectionText: {
    fontSize: 16,
    color: "#5a7184",
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
    color: "#95aac9",
    marginTop: 10,
  },
});
