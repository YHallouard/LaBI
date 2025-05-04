import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";

export const PrivacySecurityScreen: React.FC = () => {
  return (
    <ScreenLayout scrollable={true}>
      <View style={styles.container}>
        <Ionicons
          name="shield-outline"
          size={80}
          color="#2c7be5"
          style={styles.icon}
        />

        <Text style={styles.title}>Privacy & Security</Text>

        <View style={styles.policySection}>
          <Ionicons
            name="phone-portrait-outline"
            size={24}
            color="#2c7be5"
            style={styles.sectionIcon}
          />
          <Text style={styles.sectionTitle}>Local Storage Only</Text>
          <Text style={styles.sectionText}>
            All your analyses and personal data are stored exclusively on your
            device. We do not upload or store any of your health data in the
            cloud.
          </Text>
        </View>

        <View style={styles.policySection}>
          <Ionicons
            name="document-text-outline"
            size={24}
            color="#2c7be5"
            style={styles.sectionIcon}
          />
          <Text style={styles.sectionTitle}>PDF Processing</Text>
          <Text style={styles.sectionText}>
            When you upload PDFs for analysis, they are sent to Mistral&apos;s
            API for processing. These PDFs are not stored on Mistral&apos;s
            servers after processing is complete.
          </Text>
        </View>

        <View style={styles.policySection}>
          <Ionicons
            name="key-outline"
            size={24}
            color="#2c7be5"
            style={styles.sectionIcon}
          />
          <Text style={styles.sectionTitle}>API Key Security</Text>
          <Text style={styles.sectionText}>
            Your Mistral API key is stored securely on your device using
            encrypted storage. It is never shared with any third parties.
          </Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            Your privacy is our priority. The application is designed to keep
            your health data private and secure.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  icon: {
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
  policySection: {
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
  },
  summaryContainer: {
    backgroundColor: "rgba(44, 123, 229, 0.1)",
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  summaryText: {
    fontSize: 16,
    color: "#2c7be5",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
});
