import { 
  SyncingServicePort, 
  SyncDeviceInfo, 
  SyncStatus, 
  SyncProgress 
} from '../../ports/services/SyncingServicePort';

export class InMemoryMultipeerSyncService implements SyncingServicePort {
  private discoveredDevices: Map<string, SyncDeviceInfo> = new Map();
  private deviceDiscoveredCallback: ((device: SyncDeviceInfo) => void) | null = null;
  private connectionStateCallback: ((connected: boolean, deviceId?: string) => void) | null = null;
  private transferProgressCallback: ((progress: SyncProgress) => void) | null = null;
  private currentConnection: string | null = null;
  private isAdvertising = false;
  private isScanning = false;
  
  // Mock devices that will be "discovered"
  private mockDevices: SyncDeviceInfo[] = [
    { id: 'device1', name: 'Marie (iPhone 13 Pro)' },
    { id: 'device2', name: 'Thomas (Pixel 6)' },
    { id: 'device3', name: 'Laura (Galaxy S22)' },
  ];

  async initialize(): Promise<void> {
    console.log('InMemoryMultipeerSyncService initialized for testing');
  }

  async startAdvertising(deviceName: string): Promise<void> {
    this.isAdvertising = true;
    this.updateSyncProgress(SyncStatus.IDLE, 0, 'Ready to connect');
    
    let enhancedDeviceName = `${deviceName} (Simulator)`;
    console.log(`[InMemory] Started advertising as: ${enhancedDeviceName}`);
    
    setTimeout(() => {
      if (this.isAdvertising && this.connectionStateCallback) {
        this.currentConnection = 'incoming-device';
        this.connectionStateCallback(true, this.currentConnection);
        this.updateSyncProgress(SyncStatus.CONNECTED, 0, 'Device connected');
      }
    }, 5000);
  }

  async stopAdvertising(): Promise<void> {
    this.isAdvertising = false;
    console.log('[InMemory] Stopped advertising');
  }

  async startScanning(): Promise<void> {
    this.isScanning = true;
    this.discoveredDevices.clear();
    this.updateSyncProgress(SyncStatus.SCANNING, 0, 'Scanning for devices');
    console.log('[InMemory] Started scanning for devices');
    
    this.simulateDeviceDiscovery();
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
    console.log('[InMemory] Stopped scanning');
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return Array.from(this.discoveredDevices.values());
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    this.updateSyncProgress(SyncStatus.CONNECTING, 0, 'Connecting to device');
    console.log(`[InMemory] Connecting to device: ${deviceId}`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentConnection = deviceId;
        if (this.connectionStateCallback) {
          this.connectionStateCallback(true, deviceId);
        }
        this.updateSyncProgress(SyncStatus.CONNECTED, 0, 'Connected to device');
        resolve(true);
      }, 1500);
    });
  }

  async sendData(data: any): Promise<boolean> {
    this.updateSyncProgress(SyncStatus.TRANSFERRING, 0, 'Starting data transfer');
    console.log(`[InMemory] Sending data: ${typeof data}`);
    
    // Simulate data transfer with progress updates
    this.simulateProgressUpdates();
    return true;
  }

  async receiveData(): Promise<any> {
    this.updateSyncProgress(SyncStatus.TRANSFERRING, 0, 'Receiving data');
    console.log('[InMemory] Receiving data');
    
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
            'Data transfer completed'
          );
          
          // Return mock data
          resolve({
            tables: {
              biological_analyses: [
                { id: 'sample1', date: '2023-04-15', lab_values: JSON.stringify({}) },
                { id: 'sample2', date: '2023-05-20', lab_values: JSON.stringify({}) }
              ],
              user_profile: [
                { id: 1, firstName: 'John', lastName: 'Doe' }
              ]
            }
          });
        }
      }, 500);
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
    if (this.isAdvertising) {
      await this.stopAdvertising();
    }
    
    if (this.isScanning) {
      await this.stopScanning();
    }
    
    this.currentConnection = null;
    this.updateSyncProgress(SyncStatus.IDLE, 0, 'Disconnected');
    console.log('[InMemory] Disconnected');
    
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

  private simulateProgressUpdates(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      if (progress <= 90) {
        this.updateSyncProgress(
          SyncStatus.TRANSFERRING, 
          progress, 
          `Transferring data: ${progress}%`
        );
      } else {
        clearInterval(interval);
        this.updateSyncProgress(
          SyncStatus.COMPLETED, 
          100, 
          'Data transfer completed'
        );
      }
    }, 500);
  }

  private updateSyncProgress(status: SyncStatus, progress: number, message?: string): void {
    if (this.transferProgressCallback) {
      this.transferProgressCallback({ status, progress, message });
    }
  }
} 