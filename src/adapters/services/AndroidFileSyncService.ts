import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  SyncingServicePort,
  SyncDeviceInfo,
  SyncStatus,
  SyncProgress,
} from "../../ports/services/SyncingServicePort";

/**
 * Android sync service using file export/import via the native share sheet.
 * Replaces MultipeerConnectivity (iOS-only) with a file-based approach:
 * - Sender: exports data as JSON and shares via the Android share sheet
 * - Receiver: opens the file picker to select a previously shared JSON file
 */
export class AndroidFileSyncService implements SyncingServicePort {
  private transferProgressCallback: ((progress: SyncProgress) => void) | null =
    null;
  private deviceDiscoveredCallback:
    | ((device: SyncDeviceInfo) => void)
    | null = null;
  private connectionStateCallback:
    | ((connected: boolean, deviceId?: string) => void)
    | null = null;

  async initialize(): Promise<void> {
    // No initialization needed for file-based sync
  }

  async startAdvertising(_deviceName: string): Promise<void> {
    // No advertising for file-based sync
  }

  async stopAdvertising(): Promise<void> {
    // No-op
  }

  async startScanning(): Promise<void> {
    // No device scanning needed for file-based sync
  }

  async stopScanning(): Promise<void> {
    // No-op
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return [];
  }

  clearDiscoveredDevices(): void {
    // No-op
  }

  async connectToDevice(_deviceId: string): Promise<boolean> {
    return true;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async sendData(data: any): Promise<boolean> {
    try {
      this.updateSyncProgress(
        SyncStatus.TRANSFERRING,
        10,
        "Preparing export file"
      );

      const json = JSON.stringify(data);
      const fileUri = `${FileSystem.cacheDirectory}hemea-sync-${Date.now()}.json`;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      this.updateSyncProgress(
        SyncStatus.TRANSFERRING,
        50,
        "Opening share sheet"
      );

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error("Sharing is not available on this device");
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Export Héméa Data",
      });

      await FileSystem.deleteAsync(fileUri, { idempotent: true });

      this.updateSyncProgress(
        SyncStatus.COMPLETED,
        100,
        "Data exported successfully"
      );
      return true;
    } catch (error) {
      this.updateSyncProgress(
        SyncStatus.ERROR,
        0,
        `Export failed: ${error instanceof Error ? error.message : error}`
      );
      return false;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async receiveData(): Promise<any> {
    this.updateSyncProgress(SyncStatus.TRANSFERRING, 10, "Opening file picker");

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      throw new Error("No file selected");
    }

    this.updateSyncProgress(SyncStatus.TRANSFERRING, 50, "Reading file");

    const fileUri = result.assets[0].uri;
    const json = await FileSystem.readAsStringAsync(fileUri);
    const data = JSON.parse(json);

    this.updateSyncProgress(SyncStatus.TRANSFERRING, 80, "Processing data");
    return data;
  }

  onDeviceDiscovered(callback: (device: SyncDeviceInfo) => void): void {
    this.deviceDiscoveredCallback = callback;
  }

  onConnectionStateChanged(
    callback: (connected: boolean, deviceId?: string) => void
  ): void {
    this.connectionStateCallback = callback;
  }

  onTransferProgress(callback: (progress: SyncProgress) => void): void {
    this.transferProgressCallback = callback;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  setAutoDataReceptionCallback(_callback: (data: any) => void): void {
    // Not needed for file-based sync — data is received synchronously via file picker
  }

  async disconnect(): Promise<void> {
    // No-op
  }

  private updateSyncProgress(
    status: SyncStatus,
    progress: number,
    message?: string
  ): void {
    if (this.transferProgressCallback) {
      this.transferProgressCallback({ status, progress, message });
    }
  }
}
