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
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../types/navigation";
import { SaveApiKeyUseCase } from "../../application/usecases/SaveApiKeyUseCase";
import { LoadApiKeyUseCase } from "../../application/usecases/LoadApiKeyUseCase";
import { DeleteApiKeyUseCase } from "../../application/usecases/DeleteApiKeyUseCase";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../components/ScreenLayout";

type ApiKeySettingsScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "ApiKeySettingsScreen">;
  saveApiKeyUseCase: SaveApiKeyUseCase;
  loadApiKeyUseCase: LoadApiKeyUseCase;
  deleteApiKeyUseCase: DeleteApiKeyUseCase;
  onApiKeyDeleted: () => void;
  onApiKeySaved: (apiKey: string) => Promise<void>;
  onManualReload: () => void;
};

export const ApiKeySettingsScreen: React.FC<ApiKeySettingsScreenProps> = ({
  navigation,
  saveApiKeyUseCase,
  loadApiKeyUseCase,
  deleteApiKeyUseCase,
  onApiKeyDeleted,
  onApiKeySaved,
  onManualReload,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [savedApiKey, setSavedApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeletingApiKey, setIsDeletingApiKey] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    setIsLoading(true);
    try {
      const loadedKey = await loadApiKeyUseCase.execute();
      handleLoadedApiKey(loadedKey);
    } catch {
      handleApiKeyLoadError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadedApiKey = (loadedKey: string | null) => {
    if (loadedKey) {
      setApiKeyInput(loadedKey);
      setSavedApiKey(loadedKey);
    } else {
      setIsEditing(true);
    }
  };

  const handleApiKeyLoadError = () => {
    Alert.alert("Error", "Could not load API key.");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!validateApiKey()) {
      return;
    }

    dismissKeyboardAndSetSaving();

    try {
      const success = await saveApiKeyUseCase.execute(apiKeyInput);
      if (success) {
        handleSuccessfulKeySave();
      } else {
        showApiKeySaveError();
      }
    } catch {
      showApiKeySaveError();
    } finally {
      setIsSaving(false);
    }
  };

  const dismissKeyboardAndSetSaving = () => {
    Keyboard.dismiss();
    setIsSaving(true);
  };

  const validateApiKey = (): boolean => {
    if (!apiKeyInput.trim()) {
      Alert.alert("Error", "API Key cannot be empty.");
      return false;
    }
    return true;
  };

  const showApiKeySaveError = () => {
    Alert.alert("Error", "Could not save API key.");
  };

  const handleSuccessfulKeySave = () => {
    setSavedApiKey(apiKeyInput);
    setIsEditing(false);
    showSuccessMessageTemporarily("API Key saved securely.");
    saveKeyAndReloadApp();
  };

  const saveKeyAndReloadApp = () => {
    onApiKeySaved(apiKeyInput).then(() => {
      triggerReload("API key saved, reloading app...");
    });
  };

  const showSuccessMessageTemporarily = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
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
    scheduleReload();
  };

  const scheduleReload = () => {
    setTimeout(() => {
      onManualReload();
      scheduleInfoMessageClear();
    }, 1000);
  };

  const scheduleInfoMessageClear = () => {
    setTimeout(() => {
      setInfoMessage(null);
    }, 2000);
  };

  const maskApiKey = (key: string): string => {
    if (!key) return "";
    return key.length > 8
      ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
      : "********";
  };

  const deleteApiKey = async () => {
    setIsDeletingApiKey(true);
    try {
      const success = await deleteApiKeyUseCase.execute();
      if (success) {
        handleSuccessfulKeyDeletion();
      } else {
        showApiKeyDeleteError();
      }
    } catch {
      showApiKeyDeleteError();
    } finally {
      setIsDeletingApiKey(false);
    }
  };

  const showApiKeyDeleteError = () => {
    Alert.alert("Error", "Could not delete API key.");
  };

  const handleSuccessfulKeyDeletion = () => {
    resetApiKeyState();
    showSuccessMessageTemporarily("API Key deleted successfully.");
    notifyApiKeyDeletionAndReload();
  };

  const resetApiKeyState = () => {
    setSavedApiKey("");
    setApiKeyInput("");
    setIsEditing(true);
  };

  const notifyApiKeyDeletionAndReload = () => {
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

  const navigateToMistralApiKeyTutorial = () => {
    navigation.navigate("MistralApiKeyTutorial");
  };

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <ScreenLayout>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentWrapper}>
          {successMessage && <SuccessMessage message={successMessage} />}
          {infoMessage && <InfoMessage message={infoMessage} />}

          <View>
            <Text style={styles.sectionTitle}>Mistral API Key</Text>
            <Text style={styles.description}>
              Enter your Mistral API key to enable OCR features. The key is
              stored securely on your device.
            </Text>

            {isEditing ? (
              <EditingModeContent
                apiKeyInput={apiKeyInput}
                setApiKeyInput={setApiKeyInput}
                handleSave={handleSave}
                isSaving={isSaving}
                savedApiKey={savedApiKey}
                handleCancel={handleCancel}
                navigateToTutorial={navigateToMistralApiKeyTutorial}
              />
            ) : (
              <ViewModeContent
                savedApiKey={savedApiKey}
                maskApiKey={maskApiKey}
                handleEdit={handleEdit}
                confirmApiKeyDeletion={confirmApiKeyDeletion}
                isDeletingApiKey={isDeletingApiKey}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const LoadingView = () => (
  <ScreenLayout>
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2c7be5" />
    </View>
  </ScreenLayout>
);

const SuccessMessage = ({ message }: { message: string }) => (
  <View style={styles.successContainer}>
    <Ionicons
      name="checkmark-circle-outline"
      size={24}
      color="#00d97e"
      style={styles.messageIcon}
    />
    <Text style={styles.successText}>{message}</Text>
  </View>
);

const InfoMessage = ({ message }: { message: string }) => (
  <View style={styles.infoContainer}>
    <Ionicons
      name="information-circle-outline"
      size={24}
      color="#2c7be5"
      style={styles.messageIcon}
    />
    <Text style={styles.infoText}>{message}</Text>
  </View>
);

const EditingModeContent = ({
  apiKeyInput,
  setApiKeyInput,
  handleSave,
  isSaving,
  savedApiKey,
  handleCancel,
  navigateToTutorial,
}: {
  apiKeyInput: string;
  setApiKeyInput: (text: string) => void;
  handleSave: () => void;
  isSaving: boolean;
  savedApiKey: string;
  handleCancel: () => void;
  navigateToTutorial: () => void;
}) => (
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

    <TouchableOpacity style={styles.tutorialLink} onPress={navigateToTutorial}>
      <Ionicons
        name="help-circle-outline"
        size={18}
        color="#2c7be5"
        style={styles.tutorialIcon}
      />
      <Text style={styles.tutorialText}>
        Need help? View Mistral API Key tutorial
      </Text>
    </TouchableOpacity>
  </View>
);

const ViewModeContent = ({
  savedApiKey,
  maskApiKey,
  handleEdit,
  confirmApiKeyDeletion,
  isDeletingApiKey,
}: {
  savedApiKey: string;
  maskApiKey: (key: string) => string;
  handleEdit: () => void;
  confirmApiKeyDeletion: () => void;
  isDeletingApiKey: boolean;
}) => (
  <View>
    <View style={styles.savedKeyContainer}>
      <Text style={styles.savedKeyText}>{maskApiKey(savedApiKey)}</Text>
      <Button title="Edit" onPress={handleEdit} color="#2c7be5" />
    </View>

    {savedApiKey && <ApiKeyDeletionWarning />}

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
);

const ApiKeyDeletionWarning = () => (
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
  tutorialLink: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(44, 123, 229, 0.1)",
    borderRadius: 4,
    marginTop: 15,
  },
  tutorialIcon: {
    marginRight: 10,
  },
  tutorialText: {
    color: "#2c7be5",
    fontSize: 14,
  },
});
