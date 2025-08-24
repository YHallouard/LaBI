import {
  SyncingServicePort,
  SyncRole,
  SyncStatus,
  SyncProgress,
  SyncDeviceInfo,
} from "../../ports/services/SyncingServicePort";
import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";
import { ResetDatabaseUseCase } from "./ResetDatabaseUseCase";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";
import { UserProfileRepository } from "../../ports/repositories/UserProfileRepository";
import { ProfileServicePort } from "../../ports/services/ProfileServicePort";
import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import { UserProfile } from "../../domain/UserProfile";
import * as FileSystem from "expo-file-system";
// import { InMemorySyncService } from '../../adapters/services/InMemorySyncService';

export interface SyncProgressCallback {
  (progress: SyncProgress): void;
}

export class SyncDevicesUseCase {
  private syncingService: SyncingServicePort;
  private databaseStoragePort: DatabaseStoragePort;
  private biologicalAnalysisRepository: BiologicalAnalysisRepository;
  private userProfileRepository: UserProfileRepository;
  private resetDatabaseUseCase: ResetDatabaseUseCase;
  private progressCallback: SyncProgressCallback | null = null;
  private deviceName: string;
  private currentRole: SyncRole | null = null;

  constructor(
    syncingService: SyncingServicePort,
    databaseStoragePort: DatabaseStoragePort,
    biologicalAnalysisRepository: BiologicalAnalysisRepository,
    userProfileRepository: UserProfileRepository,
    profileService: ProfileServicePort,
    deviceName: string
  ) {
    this.syncingService = syncingService;
    this.databaseStoragePort = databaseStoragePort;
    this.biologicalAnalysisRepository = biologicalAnalysisRepository;
    this.userProfileRepository = userProfileRepository;
    this.resetDatabaseUseCase = new ResetDatabaseUseCase(
      databaseStoragePort,
      profileService
    );
    this.deviceName = deviceName;
  }

  async initialize(): Promise<void> {
    try {
      await this.syncingService.initialize();
      this.setupEventListeners();
    } catch (error) {
      console.error("Error initializing primary sync service:", error);

      // // Try to create a fallback service if the primary one fails
      // try {
      //   this.syncingService = new InMemorySyncService();
      //   await this.syncingService.initialize();
      //   this.setupEventListeners();
      //   console.log('Successfully initialized fallback sync service');
      // } catch (fallbackError) {
      //   console.error('Error initializing fallback sync service:', fallbackError);
      //   throw new Error(`Failed to initialize sync service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // }
    }
  }

  setProgressCallback(callback: SyncProgressCallback): void {
    this.progressCallback = callback;
    this.syncingService.onTransferProgress((progress) => {
      if (this.progressCallback) {
        this.progressCallback(progress);
      }
    });
  }

  async startAsSender(): Promise<void> {
    this.currentRole = SyncRole.SENDER;
    await this.syncingService.startAdvertising(this.deviceName);
    this.notifyProgress(SyncStatus.IDLE, 0, "Waiting for receiver to connect");
  }

  async startAsReceiver(): Promise<void> {
    this.currentRole = SyncRole.RECEIVER;

    // Set up auto data reception callback for when data arrives
    /* eslint-disable @typescript-eslint/no-explicit-any */
    this.syncingService.setAutoDataReceptionCallback(async (data: any) => {
      console.log(
        "[SyncDevicesUseCase] Auto data reception triggered, starting import process..."
      );
      try {
        await this.performDataImport(data);
      } catch (error) {
        console.error("[SyncDevicesUseCase] Error in auto data import:", error);
        this.notifyProgress(
          SyncStatus.ERROR,
          0,
          `Failed to import received data: ${error}`
        );
      }
    });

    await this.syncingService.startScanning();
    this.notifyProgress(SyncStatus.SCANNING, 0, "Scanning for sender devices");
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    const connected = await this.syncingService.connectToDevice(deviceId);

    if (connected && this.currentRole === SyncRole.RECEIVER) {
      this.notifyProgress(
        SyncStatus.CONNECTED,
        0,
        "Connected to sender, waiting for data"
      );
    }

    return connected;
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return this.syncingService.getDiscoveredDevices();
  }

  async startSync(): Promise<boolean> {
    try {
      console.log(
        "[SyncDevicesUseCase] startSync called with role:",
        this.currentRole
      );

      if (this.currentRole === SyncRole.SENDER) {
        console.log(
          "[SyncDevicesUseCase] Taking SENDER path - calling sendData()"
        );
        return await this.sendData();
      } else if (this.currentRole === SyncRole.RECEIVER) {
        console.log(
          "[SyncDevicesUseCase] Taking RECEIVER path - calling receiveData()"
        );
        return await this.receiveData();
      } else {
        console.error(
          "[SyncDevicesUseCase] No role set! currentRole is:",
          this.currentRole
        );
        throw new Error("Role not set before starting sync");
      }
    } catch (error) {
      console.error("[SyncDevicesUseCase] Error in startSync:", error);
      this.notifyProgress(SyncStatus.ERROR, 0, `Sync failed: ${error}`);
      return false;
    }
  }

  async stopSync(): Promise<void> {
    console.log(
      "[SyncDevicesUseCase] Stopping sync and cleaning up session..."
    );

    if (this.currentRole === SyncRole.SENDER) {
      await this.syncingService.stopAdvertising();
    } else if (this.currentRole === SyncRole.RECEIVER) {
      await this.syncingService.stopScanning();
    }

    // Disconnect and clear session
    await this.syncingService.disconnect();

    // Clear discovered devices to prevent duplicates
    await this.clearDiscoveredDevices();

    // Reset role and notify
    this.currentRole = null;
    this.notifyProgress(SyncStatus.IDLE, 0, "Sync stopped");

    console.log("[SyncDevicesUseCase] Sync stopped and session cleaned up");
  }

  private setupEventListeners(): void {
    this.syncingService.onDeviceDiscovered((device) => {
      console.log("[SyncDevicesUseCase] Device discovered:", device);
    });

    this.syncingService.onConnectionStateChanged((connected, deviceId) => {
      if (connected && this.currentRole === SyncRole.SENDER && deviceId) {
        this.notifyProgress(
          SyncStatus.CONNECTED,
          0,
          "Receiver connected, ready to send data"
        );
      } else if (!connected) {
        this.notifyProgress(SyncStatus.IDLE, 0, "Device disconnected");
      }
    });
  }

  private async sendData(): Promise<boolean> {
    try {
      console.log(
        "[SyncDevicesUseCase] sendData called - preparing to export data"
      );
      this.notifyProgress(SyncStatus.TRANSFERRING, 0, "Preparing data to send");

      const allData = await this.databaseStoragePort.exportData();
      console.log("[SyncDevicesUseCase] Data exported:", {
        dataType: typeof allData,
        dataKeys:
          allData && typeof allData === "object"
            ? Object.keys(allData)
            : "not an object",
        tablesCount: allData?.tables
          ? Object.keys(allData.tables).length
          : "no tables property",
        tablesKeys: allData?.tables ? Object.keys(allData.tables) : "no tables",
      });

      // Convert profile images to base64 for transfer
      await this.convertProfileImagesToBase64(allData);

      console.log("[SyncDevicesUseCase] Sending data via syncingService...");
      const success = await this.syncingService.sendData(allData);
      console.log("[SyncDevicesUseCase] Send data result:", success);

      if (success) {
        this.notifyProgress(
          SyncStatus.COMPLETED,
          100,
          "Data sent successfully"
        );
        // Automatically clean up after successful send
        await this.performPostSyncCleanup();
      }

      return success;
    } catch (error) {
      console.error("[SyncDevicesUseCase] Error in sendData:", error);
      this.notifyProgress(SyncStatus.ERROR, 0, `Failed to send data: ${error}`);
      return false;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async convertProfileImagesToBase64(data: any): Promise<void> {
    if (data.user_profile && Array.isArray(data.user_profile)) {
      for (const profile of data.user_profile) {
        if (profile.profileImage && typeof profile.profileImage === "string") {
          try {
            console.log(
              "[SyncDevicesUseCase] Converting profile image to base64:",
              profile.profileImage
            );
            this.notifyProgress(
              SyncStatus.TRANSFERRING,
              25,
              "Processing profile image"
            );

            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(
              profile.profileImage
            );
            if (fileInfo.exists) {
              // Detect image format from file extension
              const imageFormat = getImageFormat(profile.profileImage);

              // Read file as base64
              const base64Data = await FileSystem.readAsStringAsync(
                profile.profileImage,
                {
                  encoding: FileSystem.EncodingType.Base64,
                }
              );

              // Store as base64 with data URL prefix and correct MIME type
              profile.profileImage = `data:image/${imageFormat};base64,${base64Data}`;
              console.log(
                "[SyncDevicesUseCase] Profile image converted to base64 successfully"
              );
            } else {
              console.warn(
                "[SyncDevicesUseCase] Profile image file does not exist:",
                profile.profileImage
              );
              profile.profileImage = null;
            }
          } catch (error) {
            console.error(
              "[SyncDevicesUseCase] Error converting profile image to base64:",
              error
            );
            profile.profileImage = null;
          }
        }
      }
    }
  }

  private async receiveData(): Promise<boolean> {
    try {
      this.notifyProgress(
        SyncStatus.TRANSFERRING,
        0,
        "Waiting to receive data"
      );

      // Receive data
      this.notifyProgress(SyncStatus.TRANSFERRING, 20, "Receiving data");
      console.log("[SyncDevicesUseCase] Starting to receive data...");
      const receivedData = await this.syncingService.receiveData();

      // Use the shared import method
      await this.performDataImport(receivedData);

      return true;
    } catch (error) {
      console.error("[SyncDevicesUseCase] Error in receiveData:", error);
      this.notifyProgress(
        SyncStatus.ERROR,
        0,
        `Failed to receive data: ${error}`
      );
      return false;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async performDataImport(receivedData: any): Promise<void> {
    console.log("[SyncDevicesUseCase] Starting data import process...");
    this.notifyProgress(
      SyncStatus.TRANSFERRING,
      10,
      "Preparing database for sync"
    );

    // Reset database before receiving new data
    console.log("[SyncDevicesUseCase] Starting database reset...");
    await this.resetDatabaseUseCase.execute();
    console.log("[SyncDevicesUseCase] Database reset completed");

    // Log received data details
    console.log("[SyncDevicesUseCase] Data to import:", {
      dataType: typeof receivedData,
      dataKeys:
        receivedData && typeof receivedData === "object"
          ? Object.keys(receivedData)
          : "not an object",
      biologicalAnalysesCount: receivedData?.biological_analyses?.length || 0,
      userProfileExists: !!receivedData?.user_profile?.length,
    });

    try {
      // Import biological analyses using repository
      if (
        receivedData.biological_analyses &&
        Array.isArray(receivedData.biological_analyses)
      ) {
        this.notifyProgress(
          SyncStatus.TRANSFERRING,
          30,
          "Importing biological analyses"
        );
        await this.importBiologicalAnalyses(receivedData.biological_analyses);
      }

      // Import user profile using repository
      if (
        receivedData.user_profile &&
        Array.isArray(receivedData.user_profile) &&
        receivedData.user_profile.length > 0
      ) {
        this.notifyProgress(
          SyncStatus.TRANSFERRING,
          60,
          "Importing user profile"
        );
        await this.importUserProfile(receivedData.user_profile[0]);
      }

      console.log("[SyncDevicesUseCase] Data import completed successfully");
      this.notifyProgress(
        SyncStatus.COMPLETED,
        100,
        "Data received and imported successfully"
      );

      // Automatically clean up after successful import
      await this.performPostSyncCleanup();
    } catch (error) {
      console.error(
        "[SyncDevicesUseCase] Error during repository-based import:",
        error
      );
      throw error;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async importBiologicalAnalyses(analysesData: any[]): Promise<void> {
    console.log(
      `[SyncDevicesUseCase] Importing ${analysesData.length} biological analyses`
    );

    for (const analysisData of analysesData) {
      try {
        const analysis: BiologicalAnalysis = {
          id: analysisData.id,
          date: new Date(analysisData.date),
          pdfSource: analysisData.pdf_source || undefined,
        };

        // Parse lab values if present
        if (analysisData.lab_values) {
          try {
            const labValues = JSON.parse(analysisData.lab_values);
            Object.assign(analysis, labValues);
          } catch (parseError) {
            console.warn(
              `Failed to parse lab values for analysis ${analysisData.id}:`,
              parseError
            );
          }
        }

        await this.biologicalAnalysisRepository.save(analysis);
        console.log(`[SyncDevicesUseCase] Saved analysis: ${analysis.id}`);
      } catch (error) {
        console.error(
          `[SyncDevicesUseCase] Failed to save analysis ${analysisData.id}:`,
          error
        );
        throw error;
      }
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async importUserProfile(profileData: any): Promise<void> {
    console.log("[SyncDevicesUseCase] Importing user profile");

    try {
      // Convert base64 image back to file if present
      let profileImagePath = profileData.profileImage;
      if (profileImagePath && profileImagePath.startsWith("data:image/")) {
        profileImagePath = await this.convertBase64ToFile(profileImagePath);
      }

      const userProfile: UserProfile = {
        id: profileData.id,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        birthDate: new Date(profileData.birthDate),
        gender: profileData.gender,
        profileImage: profileImagePath,
        pinnedMetrics: profileData.pinnedMetrics || [],
      };

      await this.userProfileRepository.save(userProfile);
      console.log("[SyncDevicesUseCase] User profile saved successfully");
    } catch (error) {
      console.error("[SyncDevicesUseCase] Failed to save user profile:", error);
      throw error;
    }
  }

  private async convertBase64ToFile(
    base64Data: string
  ): Promise<string | null> {
    try {
      console.log("[SyncDevicesUseCase] Converting base64 to file");
      this.notifyProgress(SyncStatus.TRANSFERRING, 75, "Saving profile image");

      // Extract MIME type and base64 content from data URL
      const [mimeSection, base64Content] = base64Data.split(",");
      if (!base64Content || !mimeSection) {
        console.error("[SyncDevicesUseCase] Invalid base64 data format");
        return null;
      }

      const fileUri = CreateFileUriFromMimeSection(mimeSection);

      await FileSystem.writeAsStringAsync(fileUri, base64Content, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("[SyncDevicesUseCase] Profile image saved to:", fileUri);
      return fileUri;
    } catch (error) {
      console.error(
        "[SyncDevicesUseCase] Error converting base64 to file:",
        error
      );
      return null;
    }
  }

  private notifyProgress(
    status: SyncStatus,
    progress: number,
    message?: string
  ): void {
    if (this.progressCallback) {
      this.progressCallback({ status, progress, message });
    }
  }

  private async performPostSyncCleanup(): Promise<void> {
    try {
      console.log("[SyncDevicesUseCase] Performing post-sync cleanup...");

      // Delay cleanup slightly to allow UI to show completion state
      setTimeout(async () => {
        if (this.currentRole === SyncRole.SENDER) {
          await this.syncingService.stopAdvertising();
        } else if (this.currentRole === SyncRole.RECEIVER) {
          await this.syncingService.stopScanning();
        }

        // Disconnect and clear session
        await this.syncingService.disconnect();

        // Clear any cached discovered devices
        await this.clearDiscoveredDevices();

        console.log("[SyncDevicesUseCase] Post-sync cleanup completed");
      }, 2000); // 2 second delay
    } catch (error) {
      console.error(
        "[SyncDevicesUseCase] Error during post-sync cleanup:",
        error
      );
    }
  }

  private async clearDiscoveredDevices(): Promise<void> {
    console.log("[SyncDevicesUseCase] Clearing discovered devices");
    this.syncingService.clearDiscoveredDevices();
  }
}

const getImageFormat = (filePath: string): string => {
  const extension = filePath.toLowerCase().split(".").pop();
  switch (extension) {
    case "png":
      return "png";
    case "gif":
      return "gif";
    case "webp":
      return "webp";
    case "jpg":
    case "jpeg":
    default:
      return "jpeg";
  }
};

const CreateFileUriFromMimeSection = (mimeSection: string): string => {
  const mimeType = mimeSection.match(/data:image\/([^;]+)/);
  const imageFormat = mimeType ? mimeType[1] : "jpeg";
  const extension = imageFormat === "jpeg" ? "jpg" : imageFormat;

  const filename = `profile_image.${extension}`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  return fileUri;
};
