import { SyncDevicesUseCase } from '../SyncDevicesUseCase';
import { SyncingServicePort, SyncStatus, SyncProgress, SyncDeviceInfo } from '../../../ports/services/SyncingServicePort';
import { DatabaseStoragePort } from '../../../ports/infrastructure/DatabaseStoragePort';

// Mock implementations
class MockSyncingService implements SyncingServicePort {
  private discoveredDevices: SyncDeviceInfo[] = [];
  private connectionStateCallback: ((connected: boolean, deviceId?: string) => void) | null = null;
  private transferProgressCallback: ((progress: SyncProgress) => void) | null = null;
  
  async initialize(): Promise<void> {}
  async startAdvertising(): Promise<void> {}
  async stopAdvertising(): Promise<void> {}
  async startScanning(): Promise<void> {}
  async stopScanning(): Promise<void> {}
  getDiscoveredDevices(): SyncDeviceInfo[] { return this.discoveredDevices; }
  async connectToDevice(): Promise<boolean> { return true; }
  async sendData(): Promise<boolean> { return true; }
  async receiveData(): Promise<any> { return { data: 'test data' }; }
  onDeviceDiscovered(): void {}
  onConnectionStateChanged(callback: (connected: boolean, deviceId?: string) => void): void {
    this.connectionStateCallback = callback;
  }
  onTransferProgress(callback: (progress: SyncProgress) => void): void {
    this.transferProgressCallback = callback;
  }
  async disconnect(): Promise<void> {}

  // Test helpers
  _simulateDeviceDiscovery(device: SyncDeviceInfo): void {
    this.discoveredDevices.push(device);
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
}

class MockDatabaseStorage implements DatabaseStoragePort {
  async resetDatabase(): Promise<any> { return {}; }
  async exportData(): Promise<any> { return { data: 'exported data' }; }
  async importData(): Promise<void> {}
}

describe('SyncDevicesUseCase', () => {
  let syncDevicesUseCase: SyncDevicesUseCase;
  let mockSyncingService: MockSyncingService;
  let mockDatabaseStorage: MockDatabaseStorage;
  let progressEvents: SyncProgress[] = [];
  
  beforeEach(() => {
    mockSyncingService = new MockSyncingService();
    mockDatabaseStorage = new MockDatabaseStorage();
    syncDevicesUseCase = new SyncDevicesUseCase(
      mockSyncingService,
      mockDatabaseStorage,
      'Test Device'
    );
    
    progressEvents = [];
    syncDevicesUseCase.setProgressCallback((progress) => {
      progressEvents.push(progress);
    });
  });
  
  it('should initialize correctly', async () => {
    await syncDevicesUseCase.initialize();
    expect(syncDevicesUseCase).toBeDefined();
  });
  
  it('should start as sender and notify progress', async () => {
    await syncDevicesUseCase.startAsSender();
    
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0].status).toBe(SyncStatus.IDLE);
    expect(progressEvents[0].message).toContain('Waiting for receiver');
  });
  
  it('should start as receiver and notify progress', async () => {
    await syncDevicesUseCase.startAsReceiver();
    
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0].status).toBe(SyncStatus.SCANNING);
    expect(progressEvents[0].message).toContain('Scanning for sender');
  });
  
  it('should get discovered devices', async () => {
    mockSyncingService._simulateDeviceDiscovery({ id: 'device1', name: 'Device 1' });
    
    const devices = syncDevicesUseCase.getDiscoveredDevices();
    
    expect(devices.length).toBe(1);
    expect(devices[0].id).toBe('device1');
    expect(devices[0].name).toBe('Device 1');
  });
  
  it('should connect to device', async () => {
    const connected = await syncDevicesUseCase.connectToDevice('device1');
    
    expect(connected).toBe(true);
  });
  
  it('should update progress on connection state change', async () => {
    await syncDevicesUseCase.initialize();
    await syncDevicesUseCase.startAsSender();
    
    // Clear progress events from starting as sender
    progressEvents = [];
    
    mockSyncingService._simulateConnectionChange(true, 'device1');
    
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0].status).toBe(SyncStatus.CONNECTED);
    expect(progressEvents[0].message).toContain('ready to send data');
  });
  
  it('should start sync as sender', async () => {
    await syncDevicesUseCase.initialize();
    await syncDevicesUseCase.startAsSender();
    
    // Clear progress events
    progressEvents = [];
    
    const success = await syncDevicesUseCase.startSync();
    
    expect(success).toBe(true);
    expect(progressEvents.some(p => p.status === SyncStatus.TRANSFERRING)).toBe(true);
    expect(progressEvents.some(p => p.status === SyncStatus.COMPLETED)).toBe(true);
  });
  
  it('should start sync as receiver', async () => {
    await syncDevicesUseCase.initialize();
    await syncDevicesUseCase.startAsReceiver();
    
    // Clear progress events
    progressEvents = [];
    
    const success = await syncDevicesUseCase.startSync();
    
    expect(success).toBe(true);
    expect(progressEvents.some(p => p.status === SyncStatus.TRANSFERRING)).toBe(true);
    expect(progressEvents.some(p => p.status === SyncStatus.COMPLETED)).toBe(true);
  });
  
  it('should stop sync', async () => {
    await syncDevicesUseCase.initialize();
    await syncDevicesUseCase.startAsSender();
    
    // Clear progress events
    progressEvents = [];
    
    await syncDevicesUseCase.stopSync();
    
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0].status).toBe(SyncStatus.IDLE);
    expect(progressEvents[0].message).toContain('Sync stopped');
  });
}); 