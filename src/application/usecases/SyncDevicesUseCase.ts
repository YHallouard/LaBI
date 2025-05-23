import { SyncingServicePort, SyncRole, SyncStatus, SyncProgress, SyncDeviceInfo } from "../../ports/services/SyncingServicePort";
import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";
import { ResetDatabaseUseCase } from "./ResetDatabaseUseCase";

export interface SyncProgressCallback {
  (progress: SyncProgress): void;
}

export class SyncDevicesUseCase {
  private syncingService: SyncingServicePort;
  private databaseStoragePort: DatabaseStoragePort;
  private resetDatabaseUseCase: ResetDatabaseUseCase;
  private progressCallback: SyncProgressCallback | null = null;
  private deviceName: string;
  private currentRole: SyncRole | null = null;

  constructor(
    syncingService: SyncingServicePort,
    databaseStoragePort: DatabaseStoragePort,
    deviceName: string
  ) {
    this.syncingService = syncingService;
    this.databaseStoragePort = databaseStoragePort;
    this.resetDatabaseUseCase = new ResetDatabaseUseCase(databaseStoragePort);
    this.deviceName = deviceName;
  }

  async initialize(): Promise<void> {
    await this.syncingService.initialize();
    this.setupEventListeners();
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
    await this.syncingService.startScanning();
    this.notifyProgress(SyncStatus.SCANNING, 0, "Scanning for sender devices");
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    const connected = await this.syncingService.connectToDevice(deviceId);
    
    if (connected && this.currentRole === SyncRole.RECEIVER) {
      this.notifyProgress(SyncStatus.CONNECTED, 0, "Connected to sender, waiting for data");
    }
    
    return connected;
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return this.syncingService.getDiscoveredDevices();
  }

  async startSync(): Promise<boolean> {
    try {
      if (this.currentRole === SyncRole.SENDER) {
        return await this.sendData();
      } else if (this.currentRole === SyncRole.RECEIVER) {
        return await this.receiveData();
      } else {
        throw new Error("Role not set before starting sync");
      }
    } catch (error) {
      this.notifyProgress(SyncStatus.ERROR, 0, `Sync failed: ${error}`);
      return false;
    }
  }

  async stopSync(): Promise<void> {
    if (this.currentRole === SyncRole.SENDER) {
      await this.syncingService.stopAdvertising();
    } else if (this.currentRole === SyncRole.RECEIVER) {
      await this.syncingService.stopScanning();
    }
    
    await this.syncingService.disconnect();
    this.currentRole = null;
    this.notifyProgress(SyncStatus.IDLE, 0, "Sync stopped");
  }

  private setupEventListeners(): void {
    this.syncingService.onDeviceDiscovered((device) => {
      // This is handled through the getDiscoveredDevices method
    });
    
    this.syncingService.onConnectionStateChanged((connected, deviceId) => {
      if (connected && this.currentRole === SyncRole.SENDER && deviceId) {
        this.notifyProgress(SyncStatus.CONNECTED, 0, "Receiver connected, ready to send data");
      } else if (!connected) {
        this.notifyProgress(SyncStatus.IDLE, 0, "Device disconnected");
      }
    });
  }

  private async sendData(): Promise<boolean> {
    try {
      this.notifyProgress(SyncStatus.TRANSFERRING, 0, "Preparing data to send");
      
      const allData = await this.databaseStoragePort.exportData();
      
      const success = await this.syncingService.sendData(allData);
      
      if (success) {
        this.notifyProgress(SyncStatus.COMPLETED, 100, "Data sent successfully");
      }
      
      return success;
    } catch (error) {
      this.notifyProgress(SyncStatus.ERROR, 0, `Failed to send data: ${error}`);
      return false;
    }
  }

  private async receiveData(): Promise<boolean> {
    try {
      this.notifyProgress(SyncStatus.TRANSFERRING, 0, "Waiting to receive data");
      
      // Reset database before receiving new data
      this.notifyProgress(SyncStatus.TRANSFERRING, 10, "Preparing database for sync");
      await this.resetDatabaseUseCase.execute();
      
      // Receive data
      this.notifyProgress(SyncStatus.TRANSFERRING, 20, "Receiving data");
      const receivedData = await this.syncingService.receiveData();
      
      // Import the data
      this.notifyProgress(SyncStatus.TRANSFERRING, 80, "Importing received data");
      await this.databaseStoragePort.importData(receivedData);
      
      this.notifyProgress(SyncStatus.COMPLETED, 100, "Data received and imported successfully");
      return true;
    } catch (error) {
      this.notifyProgress(SyncStatus.ERROR, 0, `Failed to receive data: ${error}`);
      return false;
    }
  }

  private notifyProgress(status: SyncStatus, progress: number, message?: string): void {
    if (this.progressCallback) {
      this.progressCallback({ status, progress, message });
    }
  }
} 