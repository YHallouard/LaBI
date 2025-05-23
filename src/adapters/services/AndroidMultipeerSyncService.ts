import { Platform } from 'react-native';
import { 
  SyncingServicePort, 
  SyncDeviceInfo, 
  SyncStatus, 
  SyncProgress 
} from '../../ports/services/SyncingServicePort';
import Constants from 'expo-constants';

// We'll import RNMultipeer dynamically in methods to avoid issues in Expo Go

export class AndroidMultipeerSyncService implements SyncingServicePort {
  private discoveredDevices: Map<string, SyncDeviceInfo> = new Map();
  private deviceDiscoveredCallback: ((device: SyncDeviceInfo) => void) | null = null;
  private connectionStateCallback: ((connected: boolean, deviceId?: string) => void) | null = null;
  private transferProgressCallback: ((progress: SyncProgress) => void) | null = null;
  private serviceId = 'hemea-sync-service';
  private currentConnection: string | null = null;
  private listenerHandlers: Array<{ event: string, handler: any }> = [];

  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('AndroidMultipeerSyncService can only be used on Android devices');
    }

    try {
      const RNMultipeer = require('react-native-multipeer').default;
      
      // Store references to event handlers so we can remove them later
      this.listenerHandlers = [
        { event: 'peerFound', handler: this.handlePeerFound },
        { event: 'peerLost', handler: this.handlePeerLost },
        { event: 'connectedPeersChanged', handler: this.handleConnectedPeersChanged },
        { event: 'dataReceived', handler: this.handleDataReceived },
        { event: 'error', handler: this.handleError }
      ];
      
      // Add all event listeners
      for (const { event, handler } of this.listenerHandlers) {
        RNMultipeer.addEventListener(event, handler);
      }
    } catch (error) {
      console.error('Error initializing Android multipeer service:', error);
      throw error;
    }
  }

  async startAdvertising(deviceName: string): Promise<void> {
    this.updateSyncProgress(SyncStatus.IDLE, 0);
    
    // Enhance the device name with Android device model
    let enhancedDeviceName = deviceName;
    
    // Check if we're in Expo Go
    const isExpo = Constants.appOwnership === 'expo';
    
    if (isExpo) {
      // Use simulated device info in Expo Go
      enhancedDeviceName = `${deviceName} (Android Emulator)`;
    } else {
      try {
        // Only import DeviceInfo dynamically when not in Expo Go
        const DeviceInfo = require('react-native-device-info');
        const manufacturer = await DeviceInfo.getManufacturer();
        const model = await DeviceInfo.getModel();
        enhancedDeviceName = `${deviceName} (${manufacturer} ${model})`;
      } catch (error) {
        console.log("Could not get Android device info:", error);
      }
    }
    
    const RNMultipeer = require('react-native-multipeer').default;
    await RNMultipeer.advertise(this.serviceId, enhancedDeviceName);
  }

  async stopAdvertising(): Promise<void> {
    const RNMultipeer = require('react-native-multipeer').default;
    await RNMultipeer.stopAdvertising();
  }

  async startScanning(): Promise<void> {
    this.updateSyncProgress(SyncStatus.SCANNING, 0);
    this.discoveredDevices.clear();
    const RNMultipeer = require('react-native-multipeer').default;
    await RNMultipeer.browse(this.serviceId);
  }

  async stopScanning(): Promise<void> {
    const RNMultipeer = require('react-native-multipeer').default;
    await RNMultipeer.stopBrowsing();
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return Array.from(this.discoveredDevices.values());
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    this.updateSyncProgress(SyncStatus.CONNECTING, 0);
    
    const RNMultipeer = require('react-native-multipeer').default;
    try {
      await RNMultipeer.invite(deviceId);
      this.currentConnection = deviceId;
      return true;
    } catch (error) {
      this.updateSyncProgress(SyncStatus.ERROR, 0, 'Failed to connect to device');
      return false;
    }
  }

  async sendData(data: any): Promise<boolean> {
    this.updateSyncProgress(SyncStatus.TRANSFERRING, 0, 'Starting data transfer');
    
    const RNMultipeer = require('react-native-multipeer').default;
    try {
      const jsonData = JSON.stringify(data);
      await RNMultipeer.send(jsonData);
      
      // Simulate progress updates
      this.simulateProgressUpdates();
      
      return true;
    } catch (error) {
      this.updateSyncProgress(SyncStatus.ERROR, 0, 'Failed to send data');
      return false;
    }
  }

  async receiveData(): Promise<any> {
    // Data is received through the event listener
    // This method is kept for interface compatibility
    const RNMultipeer = require('react-native-multipeer').default;
    return new Promise(resolve => {
      const tempHandler = (event: any) => {
        const data = JSON.parse(event.data);
        RNMultipeer.removeEventListener('dataReceived', tempHandler);
        resolve(data);
      };
      
      RNMultipeer.addEventListener('dataReceived', tempHandler);
    });
  }

  onDeviceDiscovered(callback: (device: SyncDeviceInfo) => void): void {
    this.deviceDiscoveredCallback = callback;
  }

  onConnectionStateChanged(callback: (connected: boolean, deviceId?: string) => void): void {
    this.connectionStateCallback = callback;
  }

  onTransferProgress(callback: (progress: SyncProgress) => void): void {
    this.transferProgressCallback = callback;
  }

  async disconnect(): Promise<void> {
    const RNMultipeer = require('react-native-multipeer').default;
    await RNMultipeer.stopAdvertising();
    await RNMultipeer.stopBrowsing();
    
    // Remove event listeners
    for (const { event, handler } of this.listenerHandlers) {
      RNMultipeer.removeEventListener(event, handler);
    }
    
    this.currentConnection = null;
    this.updateSyncProgress(SyncStatus.IDLE, 0);
  }

  private handlePeerFound = (event: any) => {
    const device: SyncDeviceInfo = {
      id: event.peerId,
      name: event.peerName
    };
    
    this.discoveredDevices.set(device.id, device);
    
    if (this.deviceDiscoveredCallback) {
      this.deviceDiscoveredCallback(device);
    }
  };

  private handlePeerLost = (event: any) => {
    this.discoveredDevices.delete(event.peerId);
  };

  private handleConnectedPeersChanged = (event: any) => {
    const isConnected = event.connectedPeers.length > 0;
    
    if (isConnected) {
      this.updateSyncProgress(SyncStatus.CONNECTED, 0);
    } else {
      this.updateSyncProgress(SyncStatus.IDLE, 0);
    }
    
    if (this.connectionStateCallback) {
      const deviceId = this.currentConnection || undefined;
      this.connectionStateCallback(isConnected, deviceId);
    }
  };

  private handleDataReceived = (event: any) => {
    // Data is handled through the receiveData promise
    this.updateSyncProgress(SyncStatus.COMPLETED, 100, 'Data transfer completed');
  };

  private handleError = (event: any) => {
    this.updateSyncProgress(SyncStatus.ERROR, 0, event.error || 'Unknown error occurred');
  };

  private updateSyncProgress(status: SyncStatus, progress: number, message?: string): void {
    if (this.transferProgressCallback) {
      this.transferProgressCallback({ status, progress, message });
    }
  }

  private simulateProgressUpdates(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      if (progress <= 90) {
        this.updateSyncProgress(SyncStatus.TRANSFERRING, progress, `Transferring data: ${progress}%`);
      } else {
        clearInterval(interval);
        this.updateSyncProgress(SyncStatus.COMPLETED, 100, 'Data transfer completed');
      }
    }, 500);
  }
} 