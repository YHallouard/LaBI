import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { ResetDatabaseUseCase } from "../../application/usecases/ResetDatabaseUseCase";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";

type DatabaseSettingsScreenProps = {
  resetDatabaseUseCase: ResetDatabaseUseCase;
  onManualReload: () => void;
};

export const DatabaseSettingsScreen: React.FC<DatabaseSettingsScreenProps> = ({
  resetDatabaseUseCase,
  onManualReload,
}) => {
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const resetDatabase = async () => {
    setIsResetting(true);
    try {
      await resetDatabaseUseCase.execute();
      setSuccessMessage("Database reset completed.");

      setTimeout(() => {
        triggerReload("Database reset, reloading app...");
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Error: ${error.message}`
          : "Unknown error occurred";

      console.error("Database reset error:", error);
      Alert.alert("Reset Failed", `Failed to reset database: ${errorMessage}`);
    } finally {
      setIsResetting(false);
    }
  };

  const triggerReload = (message: string) => {
    setInfoMessage(message);

    setTimeout(() => {
      console.log("Triggering app reload...");
      onManualReload();

      setTimeout(() => {
        setInfoMessage(null);
      }, 1500);
    }, 1500);
  };

  const confirmDatabaseReset = () => {
    Alert.alert(
      "Confirm Reset",
      "This will delete all your analyses. This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetDatabase },
      ]
    );
  };

  return (
    <ScreenLayout>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentWrapper}>
          {successMessage && (
            <View style={styles.successContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#00d97e"
                style={styles.messageIcon}
              />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {infoMessage && (
            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="#2c7be5"
                style={styles.messageIcon}
              />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Database Management</Text>
          <Text style={styles.description}>
            Reset the database to remove all analyses. This action cannot be
            undone.
          </Text>

          <View style={styles.warningContainer}>
            <Ionicons
              name="warning-outline"
              size={24}
              color="#e63757"
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>
              Resetting the database will permanently delete all your analyses
              and reports.
            </Text>
          </View>

          <Button
            title={isResetting ? "Resetting..." : "Reset Database"}
            onPress={confirmDatabaseReset}
            color="#e63757"
            disabled={isResetting}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#12263f",
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    color: "#5a7184",
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(230, 55, 87, 0.1)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: "#e63757",
    fontSize: 14,
    lineHeight: 20,
  },
  successContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 217, 126, 0.1)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  successText: {
    color: "#00d97e",
    flex: 1,
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(44, 123, 229, 0.1)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  infoText: {
    color: "#2c7be5",
    flex: 1,
    fontSize: 14,
  },
  messageIcon: {
    marginRight: 10,
  },
});
