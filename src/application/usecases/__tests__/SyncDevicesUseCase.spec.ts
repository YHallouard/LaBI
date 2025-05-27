import { SyncDevicesUseCase } from '../SyncDevicesUseCase';
import { SyncingServicePort, SyncStatus, SyncProgress, SyncDeviceInfo } from '../../../ports/services/SyncingServicePort';
import { DatabaseStoragePort } from '../../../ports/infrastructure/DatabaseStoragePort';
import { BiologicalAnalysisRepository } from '../../../ports/repositories/BiologicalAnalysisRepository';
import { UserProfileRepository } from '../../../ports/repositories/UserProfileRepository';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { UserProfile } from '../../../domain/UserProfile';

// Mock expo dependencies that require React Native
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test-documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  readAsStringAsync: jest.fn().mockResolvedValue('mock-base64-content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock DatabaseInitializer to avoid expo-secure-store import
jest.mock('../../../infrastructure/database/DatabaseInitializer', () => ({
  getDatabaseStorage: jest.fn(),
  getDatabase: jest.fn(),
  resetDatabase: jest.fn(),
  initializeDatabase: jest.fn(),
}));

// Mock RepositoryFactory to avoid dependency chain
jest.mock('../../../infrastructure/repositories/RepositoryFactory', () => ({
  RepositoryFactory: {
    getBiologicalAnalysisRepository: jest.fn(),
    getUserProfileRepository: jest.fn(),
  },
}));

// Mock ProfileService to avoid dependency chain
jest.mock('../../services/ProfileService', () => ({
  ProfileService: {
    getInstance: jest.fn().mockReturnValue({
      setProfileExists: jest.fn(),
      checkProfileExists: jest.fn().mockResolvedValue(false),
    }),
  },
}));

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
  clearDiscoveredDevices(): void { this.discoveredDevices = []; }
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
  setAutoDataReceptionCallback(): void {}
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
  async initializeDatabase(): Promise<any> { return {}; }
  async getDatabase(): Promise<any> { return {}; }
  async databaseExists(): Promise<boolean> { return true; }
  async deleteDatabase(): Promise<void> {}
  async resetDatabase(): Promise<any> { return {}; }
  async exportData(): Promise<any> { return { data: 'exported data' }; }
  async importData(): Promise<void> {}
}

class MockBiologicalAnalysisRepository implements BiologicalAnalysisRepository {
  async save(analysis: BiologicalAnalysis): Promise<void> {}
  async getAll(): Promise<BiologicalAnalysis[]> { return []; }
  async getById(id: string): Promise<BiologicalAnalysis | null> { return null; }
  async deleteById(id: string): Promise<void> {}
}

class MockUserProfileRepository implements UserProfileRepository {
  async save(profile: UserProfile): Promise<UserProfile> { return profile; }
  async retrieve(): Promise<UserProfile | null> { return null; }
  async update(profile: UserProfile): Promise<void> {}
  async reset(): Promise<void> {}
}

describe('SyncDevicesUseCase', () => {
  let syncDevicesUseCase: SyncDevicesUseCase;
  let mockSyncingService: MockSyncingService;
  let mockDatabaseStorage: MockDatabaseStorage;
  let mockBiologicalAnalysisRepository: MockBiologicalAnalysisRepository;
  let mockUserProfileRepository: MockUserProfileRepository;
  let progressEvents: SyncProgress[] = [];
  let originalSetTimeout: typeof setTimeout;
  
  beforeEach(() => {
    // Store original setTimeout and mock it to execute immediately
    originalSetTimeout = global.setTimeout;
    global.setTimeout = ((callback: any) => {
      // Execute callback immediately instead of waiting
      setImmediate(callback);
      return {} as any; // Return a mock timer ID
    }) as any;
    
    mockSyncingService = new MockSyncingService();
    mockDatabaseStorage = new MockDatabaseStorage();
    mockBiologicalAnalysisRepository = new MockBiologicalAnalysisRepository();
    mockUserProfileRepository = new MockUserProfileRepository();
    syncDevicesUseCase = new SyncDevicesUseCase(
      mockSyncingService,
      mockDatabaseStorage,
      mockBiologicalAnalysisRepository,
      mockUserProfileRepository,
      'Test Device'
    );
    
    progressEvents = [];
    syncDevicesUseCase.setProgressCallback((progress) => {
      progressEvents.push(progress);
    });
  });
  
  afterEach(() => {
    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;
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
    
    // Give time for any setImmediate callbacks to execute
    await new Promise(resolve => setImmediate(resolve));
    
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
    
    // Give time for any setImmediate callbacks to execute
    await new Promise(resolve => setImmediate(resolve));
    
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