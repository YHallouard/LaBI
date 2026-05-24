import {
  SyncingServicePort,
  SyncDeviceInfo,
  SyncStatus,
  SyncProgress,
} from "../../ports/services/SyncingServicePort";

export class InMemorySyncService implements SyncingServicePort {
  private discoveredDevices: Map<string, SyncDeviceInfo> = new Map();
  private deviceDiscoveredCallback: ((device: SyncDeviceInfo) => void) | null =
    null;
  private connectionStateCallback:
    | ((connected: boolean, deviceId?: string) => void)
    | null = null;
  private transferProgressCallback: ((progress: SyncProgress) => void) | null =
    null;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private autoDataReceptionCallback: ((data: any) => void) | null = null;
  private currentConnection: string | null = null;
  private isAdvertising = false;
  private isScanning = false;

  // Test control flags
  private shouldFailInitialize = false;
  private shouldFailSendData = false;
  private shouldFailReceiveData = false;
  private shouldFailConnect = false;
  private shouldFailAdvertising = false;
  private shouldFailScanning = false;

  // Mock devices that will be "discovered"
  private mockDevices: SyncDeviceInfo[] = [
    { id: "device1", name: "Marie (iPhone 13 Pro)" },
    { id: "device2", name: "Thomas (Pixel 6)" },
    { id: "device3", name: "Laura (Galaxy S22)" },
  ];

  async initialize(): Promise<void> {
    if (this.shouldFailInitialize) {
      throw new Error("Initialization failed");
    }
    console.log("InMemoryMultipeerSyncService initialized for testing");
  }

  async startAdvertising(deviceName: string): Promise<void> {
    if (this.shouldFailAdvertising) {
      throw new Error("Advertising failed");
    }

    this.isAdvertising = true;
    this.updateSyncProgress(SyncStatus.IDLE, 0, "Ready to connect");

    const enhancedDeviceName = `${deviceName} (Simulator)`;
    console.log(`[InMemory] Started advertising as: ${enhancedDeviceName}`);

    setTimeout(() => {
      if (this.isAdvertising && this.connectionStateCallback) {
        this.currentConnection = "incoming-device";
        this.connectionStateCallback(true, this.currentConnection);
        this.updateSyncProgress(SyncStatus.CONNECTED, 0, "Device connected");
      }
    }, 5000);
  }

  async stopAdvertising(): Promise<void> {
    this.isAdvertising = false;
    console.log("[InMemory] Stopped advertising");
  }

  async startScanning(): Promise<void> {
    if (this.shouldFailScanning) {
      throw new Error("Scanning failed");
    }

    this.isScanning = true;
    this.discoveredDevices.clear();
    this.updateSyncProgress(SyncStatus.SCANNING, 0, "Scanning for devices");
    console.log("[InMemory] Started scanning for devices");

    this.simulateDeviceDiscovery();
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
    console.log("[InMemory] Stopped scanning");
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return Array.from(this.discoveredDevices.values());
  }

  clearDiscoveredDevices(): void {
    console.log("[InMemory] Clearing discovered devices");
    this.discoveredDevices.clear();
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    if (this.shouldFailConnect) {
      return false;
    }

    this.updateSyncProgress(SyncStatus.CONNECTING, 0, "Connecting to device");
    console.log(`[InMemory] Connecting to device: ${deviceId}`);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentConnection = deviceId;
        if (this.connectionStateCallback) {
          this.connectionStateCallback(true, deviceId);
        }
        this.updateSyncProgress(SyncStatus.CONNECTED, 0, "Connected to device");
        resolve(true);
      }, 1500);
    });
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async sendData(data: any): Promise<boolean> {
    if (this.shouldFailSendData) {
      return false;
    }

    this.updateSyncProgress(
      SyncStatus.TRANSFERRING,
      0,
      "Starting data transfer"
    );
    console.log(`[InMemory] Sending data: ${typeof data}`);

    // Brief progress indication
    this.updateSyncProgress(
      SyncStatus.TRANSFERRING,
      50,
      "Sending data to receiver"
    );

    // Simulate short delay for realism, then complete
    setTimeout(() => {
      this.updateSyncProgress(
        SyncStatus.COMPLETED,
        100,
        "Data sent successfully"
      );
    }, 1000);

    return true;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async receiveData(): Promise<any> {
    if (this.shouldFailReceiveData) {
      throw new Error("Receive data failed");
    }

    this.updateSyncProgress(SyncStatus.TRANSFERRING, 0, "Receiving data");
    console.log("[InMemory] Receiving data");

    return new Promise((resolve) => {
      // Simulate receiving data with progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;

        if (progress <= 90) {
          this.updateSyncProgress(
            SyncStatus.TRANSFERRING,
            progress,
            `Receiving data: ${progress}%`
          );
        } else {
          clearInterval(interval);
          this.updateSyncProgress(
            SyncStatus.COMPLETED,
            100,
            "Data transfer completed"
          );

          // Return mock data
          resolve({
            biological_analyses: [
              {
                id: "test-analysis-1",
                date: "2023-01-01",
                pdf_source: "test.pdf",
                lab_values: JSON.stringify({ test1: 100, test2: 200 }),
              },
            ],
            user_profile: [
              {
                id: "test-profile-1",
                firstName: "John",
                lastName: "Doe",
                birthDate: "1990-01-01",
                gender: "male",
                profileImage: "data:image/jpeg;base64,mock-base64-content",
                pinnedMetrics: ["test1", "test2"],
              },
            ],
          });
        }
      }, 500);
    });
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

  setAutoDataReceptionCallback(callback: (data: any) => void): void {
    this.autoDataReceptionCallback = callback;
    console.log("[InMemory] setAutoDataReceptionCallback set");
  }

  async disconnect(): Promise<void> {
    if (this.isAdvertising) {
      await this.stopAdvertising();
    }

    if (this.isScanning) {
      await this.stopScanning();
    }

    this.currentConnection = null;
    this.updateSyncProgress(SyncStatus.IDLE, 0, "Disconnected");
    console.log("[InMemory] Disconnected");

    if (this.connectionStateCallback) {
      this.connectionStateCallback(false);
    }
  }

  private simulateDeviceDiscovery(): void {
    if (!this.isScanning) return;

    this.mockDevices.forEach((device, index) => {
      setTimeout(() => {
        if (!this.isScanning) return;

        this.discoveredDevices.set(device.id, device);
        console.log(`[InMemory] Discovered device: ${device.name}`);

        if (this.deviceDiscoveredCallback) {
          this.deviceDiscoveredCallback(device);
        }
      }, 1000 * (index + 1));
    });
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

  // Test helper methods
  _simulateDeviceDiscovery(device: SyncDeviceInfo): void {
    this.discoveredDevices.set(device.id, device);
    if (this.deviceDiscoveredCallback) {
      this.deviceDiscoveredCallback(device);
    }
  }

  _simulateConnectionChange(connected: boolean, deviceId?: string): void {
    if (this.connectionStateCallback) {
      this.connectionStateCallback(connected, deviceId);
    }
  }

  _simulateTransferProgress(progress: SyncProgress): void {
    if (this.transferProgressCallback) {
      this.transferProgressCallback(progress);
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  _simulateAutoDataReception(data: any): void {
    if (this.autoDataReceptionCallback) {
      this.autoDataReceptionCallback(data);
    }
  }

  _setShouldFailInitialize(shouldFail: boolean): void {
    this.shouldFailInitialize = shouldFail;
  }

  _setShouldFailSendData(shouldFail: boolean): void {
    this.shouldFailSendData = shouldFail;
  }

  _setShouldFailReceiveData(shouldFail: boolean): void {
    this.shouldFailReceiveData = shouldFail;
  }

  _setShouldFailConnect(shouldFail: boolean): void {
    this.shouldFailConnect = shouldFail;
  }

  _setShouldFailAdvertising(shouldFail: boolean): void {
    this.shouldFailAdvertising = shouldFail;
  }

  _setShouldFailScanning(shouldFail: boolean): void {
    this.shouldFailScanning = shouldFail;
  }
}
