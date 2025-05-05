import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";

export const HelpCenterScreen: React.FC = () => {
  const handleEmailPress = () => {
    Linking.openURL("mailto:hemea@gmail.com");
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Ionicons
          name="help-circle-outline"
          size={80}
          color="#2c7be5"
          style={styles.icon}
        />

        <Text style={styles.title}>Need Help?</Text>

        <Text style={styles.description}>
          If you have any questions or issues with the app, please feel free to
          contact our support team.
        </Text>

        <TouchableOpacity
          style={styles.emailContainer}
          onPress={handleEmailPress}
        >
          <Ionicons
            name="mail-outline"
            size={24}
            color="#2c7be5"
            style={styles.emailIcon}
          />
          <Text style={styles.emailText}>contact.hemea@gmail.com</Text>
        </TouchableOpacity>

        <Text style={styles.responseText}>
          We&apos;ll get back to you as soon as possible.
        </Text>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#12263f",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#5a7184",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  emailIcon: {
    marginRight: 10,
  },
  emailText: {
    fontSize: 18,
    color: "#2c7be5",
    fontWeight: "500",
  },
  responseText: {
    fontSize: 14,
    color: "#95aac9",
    textAlign: "center",
  },
});
