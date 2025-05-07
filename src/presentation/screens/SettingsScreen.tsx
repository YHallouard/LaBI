import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";

import { SaveApiKeyUseCase } from "../../application/usecases/SaveApiKeyUseCase";
import { LoadApiKeyUseCase } from "../../application/usecases/LoadApiKeyUseCase";
import { DeleteApiKeyUseCase } from "../../application/usecases/DeleteApiKeyUseCase";
import { ResetDatabaseUseCase } from "../../application/usecases/ResetDatabaseUseCase";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";

// Define Props for the screen, including the use cases
type SettingsScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "SettingsScreen">;
  saveApiKeyUseCase: SaveApiKeyUseCase;
  loadApiKeyUseCase: LoadApiKeyUseCase;
  deleteApiKeyUseCase: DeleteApiKeyUseCase;
  resetDatabaseUseCase: ResetDatabaseUseCase;
  onApiKeyDeleted: () => void;

  onApiKeySaved: (apiKey: string) => Promise<void>;
  onManualReload: () => void;
};

type SettingsTab = "api" | "database" | "support";

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
  saveApiKeyUseCase,
  loadApiKeyUseCase,
  deleteApiKeyUseCase,
  resetDatabaseUseCase,
  onApiKeyDeleted,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onApiKeySaved,
  onManualReload,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [savedApiKey, setSavedApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("api");
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isDeletingApiKey, setIsDeletingApiKey] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    setIsLoading(true);
    setIsEditing(false);
    try {
      const loadedKey = await loadApiKeyUseCase.execute();
      if (loadedKey) {
        setApiKeyInput(loadedKey);
        setSavedApiKey(loadedKey);
      } else {
        setIsEditing(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Alert.alert("Error", "Could not load API key.");
      setIsEditing(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateApiKey()) {
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);

    try {
      const success = await saveApiKeyUseCase.execute(apiKeyInput);
      if (success) {
        handleSuccessfulKeySave();
      } else {
        Alert.alert("Error", "Could not save API key.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not save API key.");
    } finally {
      setIsSaving(false);
    }
  };

  const validateApiKey = (): boolean => {
    if (!apiKeyInput.trim()) {
      Alert.alert("Error", "API Key cannot be empty.");
      return false;
    }
    return true;
  };

  const handleSuccessfulKeySave = () => {
    setSavedApiKey(apiKeyInput);
    setIsEditing(false);
    setSuccessMessage("API Key saved securely.");
    setTimeout(() => setSuccessMessage(null), 3000);

    triggerReload("API key saved, reloading app...");
  };

  const handleEdit = () => {
    setApiKeyInput(savedApiKey);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setApiKeyInput(savedApiKey);
    setIsEditing(false);
  };

  const triggerReload = (message: string) => {
    setInfoMessage(message);
    setIsReloading(true);

    setTimeout(() => {
      onManualReload();
      setTimeout(() => {
        setIsReloading(false);
        setInfoMessage(null);
      }, 2000);
    }, 1000);
  };

  const maskApiKey = (key: string): string => {
    if (!key) return "";
    return key.length > 8
      ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
      : "********";
  };

  const resetDatabase = async () => {
    setIsResetting(true);
    try {
      await resetDatabaseUseCase.execute();
      setSuccessMessage("Database reset completed.");
      setTimeout(() => setSuccessMessage(null), 3000);
      triggerReload("Database reseted, reloading app...");
      /* eslint-disable @typescript-eslint/no-unused-vars */
    } catch (error) {
      Alert.alert("Error", "Failed to reset database. Please try again.");
    } finally {
      setIsResetting(false);
    }
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

  const deleteApiKey = async () => {
    setIsDeletingApiKey(true);
    try {
      const success = await deleteApiKeyUseCase.execute();
      if (success) {
        handleSuccessfulKeyDeletion();
      } else {
        Alert.alert("Error", "Could not delete API key.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not delete API key.");
    } finally {
      setIsDeletingApiKey(false);
    }
  };

  const handleSuccessfulKeyDeletion = () => {
    setSavedApiKey("");
    setApiKeyInput("");
    setIsEditing(true);
    setSuccessMessage("API Key deleted successfully.");
    setTimeout(() => setSuccessMessage(null), 3000);

    onApiKeyDeleted();

    triggerReload("API key deleted, reloading app...");
  };

  const confirmApiKeyDeletion = () => {
    Alert.alert(
      "Confirm Deletion",
      "This will delete your API key. You will need to enter it again to use OCR features. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteApiKey },
      ]
    );
  };

  const handleSupportOptionPress = (option: string) => {
    if (option === "Help Center") {
      navigation.navigate("HelpCenterScreen");
    } else if (option === "Privacy & Security") {
      navigation.navigate("PrivacySecurityScreen");
    } else if (option === "About") {
      navigation.navigate("AboutScreen");
    }
  };

  if (isLoading) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2c7be5" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Settings</Text>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <View style={styles.contentContainer}>
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

          {activeTab === "api" ? (
            <ApiKeySettings
              isEditing={isEditing}
              apiKeyInput={apiKeyInput}
              setApiKeyInput={setApiKeyInput}
              savedApiKey={savedApiKey}
              handleSave={handleSave}
              handleEdit={handleEdit}
              handleCancel={handleCancel}
              isSaving={isSaving}
              isDeletingApiKey={isDeletingApiKey}
              confirmApiKeyDeletion={confirmApiKeyDeletion}
              maskApiKey={maskApiKey}
            />
          ) : activeTab === "database" ? (
            <DatabaseSettings
              isResetting={isResetting}
              confirmDatabaseReset={confirmDatabaseReset}
            />
          ) : (
            <SupportSettings onOptionPress={handleSupportOptionPress} />
          )}
        </View>
      </View>
    </ScreenLayout>
  );
};

type TabNavigationProps = {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[styles.tabButton, activeTab === "api" && styles.activeTabButton]}
      onPress={() => onTabChange("api")}
    >
      <Ionicons
        name="key-outline"
        size={20}
        color={activeTab === "api" ? "#2c7be5" : "#95aac9"}
        style={styles.tabIcon}
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === "api" && styles.activeTabButtonText,
        ]}
      >
        API Key
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === "database" && styles.activeTabButton,
      ]}
      onPress={() => onTabChange("database")}
    >
      <Ionicons
        name="server-outline"
        size={20}
        color={activeTab === "database" ? "#2c7be5" : "#95aac9"}
        style={styles.tabIcon}
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === "database" && styles.activeTabButtonText,
        ]}
      >
        Database
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === "support" && styles.activeTabButton,
      ]}
      onPress={() => onTabChange("support")}
    >
      <Ionicons
        name="help-buoy-outline"
        size={20}
        color={activeTab === "support" ? "#2c7be5" : "#95aac9"}
        style={styles.tabIcon}
      />
      <Text
        style={[
          styles.tabButtonText,
          activeTab === "support" && styles.activeTabButtonText,
        ]}
      >
        Support
      </Text>
    </TouchableOpacity>
  </View>
);

type ApiKeySettingsProps = {
  isEditing: boolean;
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  savedApiKey: string;
  handleSave: () => void;
  handleEdit: () => void;
  handleCancel: () => void;
  isSaving: boolean;
  isDeletingApiKey: boolean;
  confirmApiKeyDeletion: () => void;
  maskApiKey: (key: string) => string;
};

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  isEditing,
  apiKeyInput,
  setApiKeyInput,
  savedApiKey,
  handleSave,
  handleEdit,
  handleCancel,
  isSaving,
  isDeletingApiKey,
  confirmApiKeyDeletion,
  maskApiKey,
}) => (
  <View>
    <Text style={styles.sectionTitle}>Mistral API Key</Text>
    <Text style={styles.description}>
      Enter your Mistral API key to enable OCR features. The key is stored
      securely on your device.
    </Text>

    {isEditing ? (
      <View>
        <TextInput
          style={styles.input}
          placeholder="Enter Mistral API Key"
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          secureTextEntry
          autoCapitalize="none"
        />
        <View style={styles.buttonContainer}>
          <Button
            title={isSaving ? "Saving..." : "Save API Key"}
            onPress={handleSave}
            disabled={isSaving}
            color="#2c7be5"
          />
          {savedApiKey && (
            <Button title="Cancel" onPress={handleCancel} color="gray" />
          )}
        </View>
      </View>
    ) : (
      <View>
        <View style={styles.savedKeyContainer}>
          <Text style={styles.savedKeyText}>{maskApiKey(savedApiKey)}</Text>
          <Button title="Edit" onPress={handleEdit} color="#2c7be5" />
        </View>

        {savedApiKey && (
          <View style={styles.warningContainer}>
            <Ionicons
              name="warning-outline"
              size={24}
              color="#e63757"
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>
              Deleting your API key will disable OCR features until a new key is
              provided.
            </Text>
          </View>
        )}

        {savedApiKey && (
          <View style={styles.dangerButtonContainer}>
            <Button
              title={isDeletingApiKey ? "Deleting..." : "Delete API Key"}
              onPress={confirmApiKeyDeletion}
              color="#e63757"
              disabled={isDeletingApiKey}
            />
          </View>
        )}
      </View>
    )}
  </View>
);

type DatabaseSettingsProps = {
  isResetting: boolean;
  confirmDatabaseReset: () => void;
};

const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({
  isResetting,
  confirmDatabaseReset,
}) => (
  <View>
    <Text style={styles.sectionTitle}>Database Management</Text>
    <Text style={styles.description}>
      Reset the database to remove all analyses. This action cannot be undone.
    </Text>

    <View style={styles.warningContainer}>
      <Ionicons
        name="warning-outline"
        size={24}
        color="#e63757"
        style={styles.warningIcon}
      />
      <Text style={styles.warningText}>
        Resetting the database will permanently delete all your analyses and
        reports.
      </Text>
    </View>

    <Button
      title={isResetting ? "Resetting..." : "Reset Database"}
      onPress={confirmDatabaseReset}
      color="#e63757"
      disabled={isResetting}
    />
  </View>
);

type SupportSettingsProps = {
  onOptionPress: (option: string) => void;
};

const SupportSettings: React.FC<SupportSettingsProps> = ({ onOptionPress }) => (
  <View>
    <Text style={styles.sectionTitle}>Support</Text>
    <Text style={styles.description}>
      Get help, learn about our privacy policies, and find out more about the
      app.
    </Text>

    <View style={styles.supportOptionsContainer}>
      <TouchableOpacity
        style={styles.supportOption}
        onPress={() => onOptionPress("Help Center")}
      >
        <Ionicons
          name="help-circle-outline"
          size={24}
          color="#2c7be5"
          style={styles.supportOptionIcon}
        />
        <Text style={styles.supportOptionText}>Help Center</Text>
        <Ionicons name="chevron-forward" size={20} color="#95aac9" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.supportOption}
        onPress={() => onOptionPress("Privacy & Security")}
      >
        <Ionicons
          name="shield-outline"
          size={24}
          color="#2c7be5"
          style={styles.supportOptionIcon}
        />
        <Text style={styles.supportOptionText}>Privacy & Security</Text>
        <Ionicons name="chevron-forward" size={20} color="#95aac9" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.supportOption}
        onPress={() => onOptionPress("About")}
      >
        <Ionicons
          name="information-circle-outline"
          size={24}
          color="#2c7be5"
          style={styles.supportOptionIcon}
        />
        <Text style={styles.supportOptionText}>About</Text>
        <Ionicons name="chevron-forward" size={20} color="#95aac9" />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
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
    marginBottom: 20,
    color: "#12263f",
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f7fb",
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    color: "#95aac9",
    fontWeight: "500",
  },
  activeTabButtonText: {
    color: "#2c7be5",
    fontWeight: "bold",
  },
  tabIcon: {
    marginRight: 6,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e3ebf6",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  savedKeyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f1f4f8",
    borderRadius: 4,
  },
  savedKeyText: {
    fontSize: 16,
    color: "#12263f",
    fontFamily: "monospace",
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
  dangerButtonContainer: {
    marginTop: 10,
  },
  reloadButtonContainer: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "rgba(44, 123, 229, 0.1)",
    borderColor: "#2c7be5",
    borderWidth: 1,
    borderRadius: 8,
  },
  reloadText: {
    color: "#2c7be5",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  supportOptionsContainer: {
    marginTop: 10,
    backgroundColor: "#f9fbfd",
    borderRadius: 8,
    overflow: "hidden",
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f4f8",
  },
  supportOptionIcon: {
    marginRight: 16,
  },
  supportOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#12263f",
  },
});
