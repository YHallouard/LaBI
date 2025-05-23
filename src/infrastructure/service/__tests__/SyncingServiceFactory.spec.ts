import { SyncingServiceFactory } from '../SyncingServiceFactory';
import { Platform } from 'react-native';
import { InMemoryMultipeerSyncService } from '../../../adapters/services/InMemoryMultipeerSyncService';
import { IOSMultipeerSyncService } from '../../../adapters/services/IOSMultipeerSyncService';
import { AndroidMultipeerSyncService } from '../../../adapters/services/AndroidMultipeerSyncService';

// Mock the Platform module
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(obj => obj.ios)
  }
}));

// Mock Constants from expo-constants
jest.mock('expo-constants', () => ({
  appOwnership: 'standalone'
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => 'Test iPhone'),
  getManufacturer: jest.fn(() => 'Apple')
}));

describe('SyncingServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global.__DEV__ using type assertion
    (global as any).__DEV__ = false;
  });

  it('should create InMemoryMultipeerSyncService when in Expo Go', () => {
    // Mock Expo Go environment
    require('expo-constants').appOwnership = 'expo';
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(InMemoryMultipeerSyncService);
  });

  it('should create InMemoryMultipeerSyncService when in development mode', () => {
    // Set development mode flag
    (global as any).__DEV__ = true;
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(InMemoryMultipeerSyncService);
  });

  it('should create IOSMultipeerSyncService for iOS production', () => {
    // Mock iOS production environment
    Platform.OS = 'ios';
    require('expo-constants').appOwnership = 'standalone';
    (global as any).__DEV__ = false;
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(IOSMultipeerSyncService);
  });

  it('should create AndroidMultipeerSyncService for Android production', () => {
    // Mock Android production environment
    Platform.OS = 'android';
    require('expo-constants').appOwnership = 'standalone';
    (global as any).__DEV__ = false;
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(AndroidMultipeerSyncService);
  });

  it('should handle errors and fall back to InMemoryMultipeerSyncService', () => {
    // Mock iOS production environment with an error
    Platform.OS = 'ios';
    require('expo-constants').appOwnership = 'standalone';
    (global as any).__DEV__ = false;
    
    // Mock an error when importing IOSMultipeerSyncService
    jest.mock('../../../adapters/services/IOSMultipeerSyncService', () => {
      throw new Error('Module not found');
    });
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(InMemoryMultipeerSyncService);
  });
}); 