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
import { colorPalette, generateAlpha } from "../../config/themes";

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
                color={colorPalette.feedback.success}
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
                color={colorPalette.primary.main}
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
              color={colorPalette.feedback.error}
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
            color={colorPalette.feedback.error}
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
    color: colorPalette.neutral.main,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    color: colorPalette.neutral.light,
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: "row",
    backgroundColor: generateAlpha(colorPalette.feedback.error, 0.1),
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
    color: colorPalette.feedback.error,
    fontSize: 14,
    lineHeight: 20,
  },
  successContainer: {
    flexDirection: "row",
    backgroundColor: generateAlpha(colorPalette.feedback.success, 0.1),
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  successText: {
    color: colorPalette.feedback.success,
    flex: 1,
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: generateAlpha(colorPalette.primary.main, 0.1),
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  infoText: {
    color: colorPalette.primary.main,
    flex: 1,
    fontSize: 14,
  },
  messageIcon: {
    marginRight: 10,
  },
});
