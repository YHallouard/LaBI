import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "../../components/ScreenLayout";
import { colorPalette } from "../../../config/themes";
import { SyncDevicesUseCase } from "../../../domain/usecases/SyncDevicesUseCase";
import { SyncingServiceFactory } from "../../../infrastructure/service/SyncingServiceFactory";
import {
  SyncDeviceInfo,
  SyncProgress,
  SyncRole,
  SyncStatus,
} from "../../../ports/services/SyncingServicePort";
import { RetrieveUserProfileUseCase } from "../../../domain/usecases/RetrieveUserProfileUseCase";
import { ProfileService } from "../../../domain/services/ProfileService";
import { RepositoryFactory } from "../../../infrastructure/repositories/RepositoryFactory";
import { getDatabaseStorage } from "../../../infrastructure/database/DatabaseInitializer";

type SyncScreenProps = {
  navigation: StackNavigationProp<HomeStackParamList, "SyncScreen">;
};

export const SyncScreen: React.FC<SyncScreenProps> = ({ navigation }) => {
  const [syncRole, setSyncRole] = useState<SyncRole | null>(null);
  const [syncUseCase, setSyncUseCase] = useState<SyncDevicesUseCase | null>(
    null
  );
  const [discoveredDevices, setDiscoveredDevices] = useState<SyncDeviceInfo[]>(
    []
  );
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: SyncStatus.IDLE,
    progress: 0,
  });
  const [deviceName, setDeviceName] = useState<string>("Héméa Device");
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Usecase GetDeviceName
        const userProfileRepository =
          await RepositoryFactory.getUserProfileRepository();
        const retrieveUserProfileUseCase = new RetrieveUserProfileUseCase(
          userProfileRepository
        );
        const profile = await retrieveUserProfileUseCase.execute();

        if (profile) {
          // Just use the profile name - adapters will add device info
          const formattedName = `${profile.firstName} - Héméa`;
          setDeviceName(formattedName);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const initialize = async () => {
      try {
        const syncingService = SyncingServiceFactory.createSyncingService();
        const databaseAdapter = await getDatabaseStorage();
        const biologicalAnalysisRepository =
          await RepositoryFactory.getBiologicalAnalysisRepository();
        const userProfileRepository =
          await RepositoryFactory.getUserProfileRepository();

        const profileService = ProfileService.getInstance();
        profileService.initialize(userProfileRepository);

        const useCase = new SyncDevicesUseCase(
          syncingService,
          databaseAdapter,
          biologicalAnalysisRepository,
          userProfileRepository,
          profileService,
          deviceName
        );

        await useCase.initialize();
        useCase.setProgressCallback(handleProgressUpdate);
        setSyncUseCase(useCase);
      } catch (error) {
        console.error("Error initializing sync:", error);
        Alert.alert("Error", `Failed to initialize sync: ${error}`);
      }
    };

    initialize();

    return () => {
      // Clean up when unmounting
      if (syncUseCase) {
        syncUseCase
          .stopSync()
          .catch((error) => console.error("Error stopping sync:", error));
      }
    };
  }, [deviceName, isLoading]);

  useEffect(() => {
    // Update the list of discovered devices periodically
    if (syncRole === SyncRole.RECEIVER && syncUseCase) {
      const interval = setInterval(() => {
        const devices = syncUseCase.getDiscoveredDevices();
        setDiscoveredDevices(devices);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [syncRole, syncUseCase]);

  const handleProgressUpdate = (progress: SyncProgress) => {
    setSyncProgress(progress);
  };

  const startAsSender = async () => {
    if (!syncUseCase) return;

    try {
      console.log("[SyncScreen] Starting as SENDER");
      setSyncRole(SyncRole.SENDER);
      await syncUseCase.startAsSender();
      console.log("[SyncScreen] Successfully started as SENDER");

      // On Android, skip the discovery/connection phase and go straight to export
      if (Platform.OS === "android") {
        await syncUseCase.startSync();
      }
    } catch (error) {
      console.error("[SyncScreen] Error starting as sender:", error);
      Alert.alert("Error", `Failed to start as sender: ${error}`);
    }
  };

  const startAsReceiver = async () => {
    if (!syncUseCase) return;

    try {
      console.log("[SyncScreen] Starting as RECEIVER");
      setSyncRole(SyncRole.RECEIVER);
      await syncUseCase.startAsReceiver();
      console.log("[SyncScreen] Successfully started as RECEIVER");

      // On Android, skip the discovery/connection phase and go straight to import
      if (Platform.OS === "android") {
        await syncUseCase.startSync();
      }
    } catch (error) {
      console.error("[SyncScreen] Error starting as receiver:", error);
      Alert.alert("Error", `Failed to start as receiver: ${error}`);
    }
  };

  const connectToDevice = async (deviceId: string) => {
    if (!syncUseCase) return;

    try {
      console.log("[SyncScreen] Connecting to device:", deviceId);
      const connected = await syncUseCase.connectToDevice(deviceId);
      console.log("[SyncScreen] Connection result:", connected);
      if (!connected) {
        Alert.alert("Error", "Failed to connect to device");
      }
    } catch (error) {
      console.error("[SyncScreen] Error connecting to device:", error);
      Alert.alert("Error", `Failed to connect: ${error}`);
    }
  };

  const startSync = async () => {
    if (!syncUseCase) return;

    try {
      console.log("[SyncScreen] Starting sync process...");
      await syncUseCase.startSync();
      console.log("[SyncScreen] Sync process completed");
    } catch (error) {
      console.error("[SyncScreen] Error starting sync:", error);
      Alert.alert("Error", `Failed to start sync: ${error}`);
    }
  };

  const cancelSync = async () => {
    if (!syncUseCase) return;

    try {
      await syncUseCase.stopSync();
      setSyncRole(null);
      setSyncProgress({
        status: SyncStatus.IDLE,
        progress: 0,
      });
    } catch (error) {
      Alert.alert("Error", `Failed to stop sync: ${error}`);
    }
  };

  const renderRoleSelection = () => {
    const isAndroid = Platform.OS === "android";
    return (
      <View style={styles.roleSelection}>
        <Text style={styles.roleHeading}>Choose Sync Mode</Text>
        <Text style={styles.roleDescription}>
          {isAndroid
            ? "Export your data as a file to share, or import a file received from another device"
            : "Select the role for this device in the sync operation"}
        </Text>

        <TouchableOpacity style={styles.roleButton} onPress={startAsSender}>
          <Ionicons
            name="arrow-up-circle"
            size={40}
            color={colorPalette.primary.main}
          />
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleButtonTitle}>
              {isAndroid ? "Export Data" : "Send Data"}
            </Text>
            <Text style={styles.roleButtonDescription}>
              {isAndroid
                ? "Save your data as a file and share it via the share sheet"
                : "Share your device's data with another device"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.roleButton} onPress={startAsReceiver}>
          <Ionicons
            name="arrow-down-circle"
            size={40}
            color={colorPalette.primary.main}
          />
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleButtonTitle}>
              {isAndroid ? "Import Data" : "Receive Data"}
            </Text>
            <Text style={styles.roleButtonDescription}>
              {isAndroid
                ? "Select a previously exported file to restore data (will replace current data)"
                : "Get data from another device (will replace current data)"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDeviceItem = (item: SyncDeviceInfo) => (
    <TouchableOpacity
      key={item.id}
      style={styles.deviceItem}
      onPress={() => connectToDevice(item.id)}
    >
      <Ionicons
        name="phone-portrait"
        size={24}
        color={colorPalette.primary.main}
      />
      <Text style={styles.deviceName}>{item.name}</Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colorPalette.neutral.light}
      />
    </TouchableOpacity>
  );

  const renderDeviceList = () => (
    <View style={styles.deviceListContainer}>
      <Text style={styles.sectionTitle}>Available Devices</Text>
      {discoveredDevices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Searching for devices...</Text>
          <ActivityIndicator color={colorPalette.primary.main} />
        </View>
      ) : (
        <View style={styles.deviceList}>
          {discoveredDevices.map(renderDeviceItem)}
        </View>
      )}
      <TouchableOpacity style={styles.cancelButton} onPress={cancelSync}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSenderWaiting = () => (
    <View style={styles.waitingContainer}>
      <Text style={styles.sectionTitle}>Waiting for Receiver</Text>
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color={colorPalette.primary.main} />
        <Text style={styles.statusText}>
          This device is ready to send data. Waiting for a receiver to
          connect...
        </Text>
      </View>
      <TouchableOpacity style={styles.cancelButton} onPress={cancelSync}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgress = () => {
    const isCompleted = syncProgress.status === SyncStatus.COMPLETED;
    const isError = syncProgress.status === SyncStatus.ERROR;
    const isTransferring = syncProgress.status === SyncStatus.TRANSFERRING;

    // Different icons and messages for receiver vs sender
    const getTransferIcon = () => {
      if (isCompleted) return "checkmark-circle";
      if (isError) return "alert-circle";
      if (syncRole === SyncRole.RECEIVER) return "cloud-download";
      return "cloud-upload";
    };

    const getTransferMessage = () => {
      if (isCompleted) {
        return syncRole === SyncRole.RECEIVER
          ? "Data received successfully!"
          : "Data sent successfully!";
      }
      if (isError) return "Sync failed";
      if (syncRole === SyncRole.RECEIVER) return "Receiving data...";
      return "Sending data...";
    };

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>
          {isCompleted
            ? "Sync Complete"
            : isError
            ? "Sync Error"
            : getTransferMessage()}
        </Text>

        <View style={styles.statusContainer}>
          <View style={styles.progressIconContainer}>
            <Ionicons
              name={getTransferIcon()}
              size={isTransferring ? 50 : 60}
              color={isError ? "#ff4444" : colorPalette.primary.main}
            />
            {isTransferring && (
              <ActivityIndicator
                size="large"
                color={colorPalette.primary.main}
                style={styles.progressSpinner}
              />
            )}
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${syncProgress.progress}%` },
                isError ? styles.progressBarError : null,
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {syncProgress.message || `${syncProgress.progress}% complete`}
          </Text>
        </View>

        {isCompleted || isError ? (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>
              {isCompleted ? "Done" : "Close"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelSync}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderConnectedUI = () => {
    if (syncProgress.status === SyncStatus.CONNECTED) {
      if (syncRole === SyncRole.RECEIVER) {
        // Receiver just waits for data with animation
        return (
          <View style={styles.connectedContainer}>
            <Text style={styles.sectionTitle}>Waiting for Data</Text>
            <View style={styles.statusContainer}>
              <View style={styles.dataWaitingAnimation}>
                <Ionicons
                  name="cloud-download"
                  size={60}
                  color={colorPalette.primary.main}
                />
                <ActivityIndicator
                  size="large"
                  color={colorPalette.primary.main}
                  style={styles.waitingSpinner}
                />
              </View>
              <Text style={styles.connectedText}>
                Connected! Waiting for the sender to start transferring data...
              </Text>
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelSync}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        // Sender needs to manually start sync
        return (
          <View style={styles.connectedContainer}>
            <Text style={styles.sectionTitle}>Ready to Sync</Text>
            <Text style={styles.connectedText}>
              Receiver connected and ready to receive your data
            </Text>
            <TouchableOpacity style={styles.syncButton} onPress={startSync}>
              <Text style={styles.syncButtonText}>Start Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelSync}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
    return null;
  };

  const renderContent = () => {
    if (!syncRole) {
      return renderRoleSelection();
    }

    if (
      syncProgress.status === SyncStatus.TRANSFERRING ||
      syncProgress.status === SyncStatus.COMPLETED ||
      syncProgress.status === SyncStatus.ERROR
    ) {
      return renderProgress();
    }

    if (syncProgress.status === SyncStatus.CONNECTED) {
      return renderConnectedUI();
    }

    if (syncRole === SyncRole.SENDER) {
      return renderSenderWaiting();
    }

    if (syncRole === SyncRole.RECEIVER) {
      return renderDeviceList();
    }

    return null;
  };

  return (
    <ScreenLayout scrollable={true}>
      <View style={styles.container}>{renderContent()}</View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  roleSelection: {
    flex: 1,
    justifyContent: "center",
  },
  roleHeading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    color: colorPalette.neutral.main,
    textAlign: "center",
  },
  roleDescription: {
    fontSize: 16,
    marginBottom: 32,
    color: colorPalette.neutral.light,
    textAlign: "center",
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: colorPalette.neutral.main,
  },
  roleButtonDescription: {
    fontSize: 14,
    color: colorPalette.neutral.light,
  },
  deviceListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: colorPalette.neutral.main,
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: colorPalette.neutral.main,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 16,
    color: colorPalette.neutral.light,
  },
  cancelButton: {
    backgroundColor: colorPalette.neutral.lighter,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colorPalette.neutral.main,
  },
  waitingContainer: {
    flex: 1,
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral.white,
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: colorPalette.neutral.main,
  },
  progressContainer: {
    flex: 1,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colorPalette.neutral.lighter,
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colorPalette.primary.main,
  },
  progressBarError: {
    backgroundColor: colorPalette.primary.main,
  },
  progressText: {
    fontSize: 16,
    color: colorPalette.neutral.main,
    textAlign: "center",
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: colorPalette.primary.main,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colorPalette.neutral.white,
  },
  connectedContainer: {
    flex: 1,
  },
  connectedText: {
    fontSize: 16,
    color: colorPalette.neutral.main,
    marginBottom: 32,
  },
  syncButton: {
    backgroundColor: colorPalette.primary.main,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colorPalette.neutral.white,
  },
  dataWaitingAnimation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  waitingSpinner: {
    marginLeft: 12,
  },
  progressIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  progressSpinner: {
    marginLeft: 12,
  },
});
