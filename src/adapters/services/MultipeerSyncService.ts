import { Platform } from "react-native";
import {
  SyncingServicePort,
  SyncDeviceInfo,
  SyncStatus,
  SyncProgress,
} from "../../ports/services/SyncingServicePort";

// Import the modern multipeer library
import {
  initSession,
  MPCSession,
  PeerState,
} from "react-native-multipeer-connectivity";
import { APP_NAME, APP_VERSION } from "../../utils/appConstants";

export class MultipeerSyncService implements SyncingServicePort {
  private discoveredDevices: Map<string, SyncDeviceInfo> = new Map();
  private deviceDiscoveredCallback: ((device: SyncDeviceInfo) => void) | null =
    null;
  private connectionStateCallback:
    | ((connected: boolean, deviceId?: string) => void)
    | null = null;
  private transferProgressCallback: ((progress: SyncProgress) => void) | null =
    null;
  private serviceId = "hemea-sync";
  private currentConnection: string | null = null;
  private session: MPCSession | null = null;

  async initialize(): Promise<void> {
    try {
      // Initialize the multipeer session with default values
      // The actual device name will be set in startAdvertising
      this.session = initSession({
        displayName: "Héméa Device", // Temporary name, will be updated in startAdvertising
        serviceType: this.serviceId,
        discoveryInfo: {
          appName: APP_NAME,
          version: APP_VERSION,
        },
      });

      this.setupEventListeners();
      console.log("MultipeerSyncService initialized successfully");
    } catch (error) {
      console.error("Error initializing multipeer service:", error);
      throw new Error(
        `MultipeerSyncService initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async startAdvertising(deviceName: string): Promise<void> {
    this.updateSyncProgress(SyncStatus.IDLE, 0);

    if (!this.session) {
      throw new Error("Session not initialized");
    }

    try {
      // Use device name as-is without trying to get device model
      const enhancedDeviceName = `${deviceName} (${Platform.OS})`;

      // Update the session display name
      this.session = initSession({
        displayName: enhancedDeviceName,
        serviceType: this.serviceId,
        discoveryInfo: {
          appName: APP_NAME,
          version: APP_VERSION,
        },
      });

      this.setupEventListeners();
      await this.session.advertize();
      console.log(
        `[${Platform.OS}] Started advertising as: ${enhancedDeviceName}`
      );
    } catch (error) {
      console.error(`[${Platform.OS}] Error starting advertising:`, error);
      throw error;
    }
  }

  async stopAdvertising(): Promise<void> {
    if (!this.session) return;

    try {
      await this.session.stopAdvertizing();
      console.log(`[${Platform.OS}] Stopped advertising`);
    } catch (error) {
      console.error(`[${Platform.OS}] Error stopping advertising:`, error);
    }
  }

  async startScanning(): Promise<void> {
    this.updateSyncProgress(SyncStatus.SCANNING, 0);
    this.discoveredDevices.clear();

    if (!this.session) {
      throw new Error("Session not initialized");
    }

    try {
      await this.session.browse();
      console.log(`[${Platform.OS}] Started scanning for devices`);
    } catch (error) {
      console.error(`[${Platform.OS}] Error starting scan:`, error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    if (!this.session) return;

    try {
      await this.session.stopBrowsing();
      // Clear discovered devices when stopping scan to prevent accumulation
      this.discoveredDevices.clear();
      console.log(`[${Platform.OS}] Stopped scanning and cleared device list`);
    } catch (error) {
      console.error(`[${Platform.OS}] Error stopping scan:`, error);
    }
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return Array.from(this.discoveredDevices.values());
  }

  clearDiscoveredDevices(): void {
    console.log(`[${Platform.OS}] Clearing discovered devices`);
    this.discoveredDevices.clear();
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    this.updateSyncProgress(SyncStatus.CONNECTING, 0);

    if (!this.session) {
      throw new Error("Session not initialized");
    }

    try {
      await this.session.invite(deviceId);
      this.currentConnection = deviceId;
      console.log(`[${Platform.OS}] Sent invitation to device: ${deviceId}`);
      return true;
    } catch (error) {
      console.error(`[${Platform.OS}] Error connecting to device:`, error);
      this.updateSyncProgress(
        SyncStatus.ERROR,
        0,
        "Failed to connect to device"
      );
      return false;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async sendData(data: any): Promise<boolean> {
    this.updateSyncProgress(
      SyncStatus.TRANSFERRING,
      0,
      "Starting data transfer"
    );

    if (!this.session || !this.currentConnection) {
      throw new Error("No active connection");
    }

    try {
      const jsonData = JSON.stringify(data);

      // Show progress during actual sending
      this.updateSyncProgress(
        SyncStatus.TRANSFERRING,
        50,
        "Sending data to receiver"
      );

      await this.session.sendText(this.currentConnection, jsonData);

      // Complete immediately after successful send
      this.updateSyncProgress(
        SyncStatus.COMPLETED,
        100,
        "Data sent successfully"
      );

      console.log(`[${Platform.OS}] Data sent successfully`);
      return true;
    } catch (error) {
      console.error(`[${Platform.OS}] Error sending data:`, error);
      this.updateSyncProgress(SyncStatus.ERROR, 0, "Failed to send data");
      return false;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async receiveData(): Promise<any> {
    console.log(
      `[MultipeerSyncService] receiveData called - checking for pending data`
    );

    // Check if we already have received data stored
    /* eslint-disable @typescript-eslint/no-explicit-any */
    if ((this as any)._receivedData) {
      console.log(`[MultipeerSyncService] Found pending data, returning it`);
      const data = (this as any)._receivedData;
      delete (this as any)._receivedData;
      return data;
    }

    // If no data yet, wait for it
    console.log(
      `[MultipeerSyncService] No pending data, waiting for data reception...`
    );
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Data receive timeout"));
      }, 30000); // 30 second timeout

      // Set up a one-time listener for data
      const cleanup = () => {
        clearTimeout(timeout);
      };

      // Store the resolve function to be called when data is received
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (this as any)._dataReceiveResolver = (data: any) => {
        cleanup();
        resolve(data);
      };
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
    (this as any)._autoDataReceptionCallback = callback;
  }

  async disconnect(): Promise<void> {
    if (!this.session) return;

    try {
      // Stop any ongoing advertising or browsing
      await this.session.stopAdvertizing().catch(() => {});
      await this.session.stopBrowsing().catch(() => {});

      // Disconnect from all peers
      await this.session.disconnect();

      // Clear state
      this.currentConnection = null;
      this.discoveredDevices.clear();

      this.updateSyncProgress(SyncStatus.IDLE, 0);
      console.log(`[${Platform.OS}] Disconnected and cleared session state`);
    } catch (error) {
      console.error(`[${Platform.OS}] Error disconnecting:`, error);
    }
  }

  private setupEventListeners(): void {
    if (!this.session) return;

    // Handle discovered peers
    this.session.onFoundPeer((event) => {
      const device: SyncDeviceInfo = {
        id: event.peer.id,
        name: event.peer.displayName,
      };

      // Remove any existing device with the same name to prevent duplicates
      for (const [
        existingId,
        existingDevice,
      ] of this.discoveredDevices.entries()) {
        if (existingDevice.name === device.name && existingId !== device.id) {
          this.discoveredDevices.delete(existingId);
          console.log(
            `[${Platform.OS}] Removed duplicate device: ${existingDevice.name} (${existingId})`
          );
        }
      }

      this.discoveredDevices.set(device.id, device);
      console.log(
        `[${Platform.OS}] Discovered device: ${device.name} (${device.id})`
      );

      if (this.deviceDiscoveredCallback) {
        this.deviceDiscoveredCallback(device);
      }
    });

    // Handle lost peers
    this.session.onLostPeer((event) => {
      this.discoveredDevices.delete(event.peer.id);
      console.log(`[${Platform.OS}] Lost device: ${event.peer.displayName}`);
    });

    // Handle peer state changes
    this.session.onPeerStateChanged((event) => {
      const isConnected = event.state === PeerState.connected;

      if (isConnected) {
        this.updateSyncProgress(SyncStatus.CONNECTED, 0);
        this.currentConnection = event.peer.id;
      } else if (event.state === PeerState.notConnected) {
        this.updateSyncProgress(SyncStatus.IDLE, 0);
        this.currentConnection = null;
      }

      if (this.connectionStateCallback) {
        this.connectionStateCallback(isConnected, event.peer.id);
      }

      console.log(
        `[${Platform.OS}] Peer ${event.peer.displayName} state changed to: ${event.state}`
      );
    });

    // Handle received invitations
    this.session.onReceivedPeerInvitation((event) => {
      console.log(
        `[${Platform.OS}] Received invitation from: ${event.peer.displayName}`
      );
      // Auto-accept invitations for now
      event.handler(true);
    });

    // Handle received text data
    this.session.onReceivedText((event) => {
      console.log(
        `[${Platform.OS}] Received data from: ${event.peer.displayName}`
      );

      try {
        const data = JSON.parse(event.text);
        console.log(`[${Platform.OS}] Parsed received data:`, {
          dataType: typeof data,
          dataKeys:
            data && typeof data === "object"
              ? Object.keys(data)
              : "not an object",
        });

        // Store the data for receiveData() to pick up
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (this as any)._receivedData = data;

        // Call the data receive resolver if it exists
        /* eslint-disable @typescript-eslint/no-explicit-any */
        if ((this as any)._dataReceiveResolver) {
          console.log(`[${Platform.OS}] Calling data receive resolver`);
          /* eslint-disable @typescript-eslint/no-explicit-any */
          (this as any)._dataReceiveResolver(data);
          /* eslint-disable @typescript-eslint/no-explicit-any */
          delete (this as any)._dataReceiveResolver;
        } else {
          console.log(
            `[${Platform.OS}] No resolver waiting, auto-triggering data reception callback`
          );
          // Auto-trigger the data reception callback if set
          /* eslint-disable @typescript-eslint/no-explicit-any */
          if ((this as any)._autoDataReceptionCallback) {
            console.log(
              `[${Platform.OS}] Calling auto data reception callback`
            );
            /* eslint-disable @typescript-eslint/no-explicit-any */
            (this as any)._autoDataReceptionCallback(data);
          }
        }

        this.updateSyncProgress(
          SyncStatus.COMPLETED,
          100,
          "Data transfer completed"
        );
      } catch (error) {
        console.error(`[${Platform.OS}] Error parsing received data:`, error);
        this.updateSyncProgress(
          SyncStatus.ERROR,
          0,
          "Failed to parse received data"
        );
      }
    });

    // Handle errors
    this.session.onStartAdvertisingError((event) => {
      console.error(`[${Platform.OS}] Advertising error:`, event.text);
      this.updateSyncProgress(SyncStatus.ERROR, 0, event.text);
    });

    this.session.onStartBrowsingError((event) => {
      console.error(`[${Platform.OS}] Browsing error:`, event.text);
      this.updateSyncProgress(SyncStatus.ERROR, 0, event.text);
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
}
