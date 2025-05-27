import { SyncingServiceFactory } from '../SyncingServiceFactory';
import { Platform } from 'react-native';
import { InMemorySyncService } from '../../../adapters/services/InMemorySyncService';
import { MultipeerSyncService } from '../../../adapters/services/MultipeerSyncService';

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

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => 'Test Device'),
  getManufacturer: jest.fn(() => 'Apple')
}));

describe('SyncingServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global.__DEV__ using type assertion
    (global as any).__DEV__ = false;
  });

  it('should create InMemorySyncService when in Expo Go', () => {
    // Mock Expo Go environment
    require('expo-constants').appOwnership = 'expo';
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(InMemorySyncService);
  });

  it('should create InMemorySyncService when not on physical device', () => {
    // Mock simulator/emulator environment
    require('expo-device').isDevice = false;
    require('expo-constants').appOwnership = 'standalone';
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(InMemorySyncService);
  });

  it('should create MultipeerSyncService for iOS production on physical device', () => {
    // Mock iOS production environment on physical device
    Platform.OS = 'ios';
    require('expo-constants').appOwnership = 'standalone';
    require('expo-device').isDevice = true;
    (global as any).__DEV__ = false;
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(MultipeerSyncService);
  });

  it('should create MultipeerSyncService for Android production on physical device', () => {
    // Mock Android production environment on physical device
    Platform.OS = 'android';
    require('expo-constants').appOwnership = 'standalone';
    require('expo-device').isDevice = true;
    (global as any).__DEV__ = false;
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(MultipeerSyncService);
  });

  it('should handle errors and fall back to InMemorySyncService', () => {
    // Mock production environment with an error
    Platform.OS = 'ios';
    require('expo-constants').appOwnership = 'standalone';
    require('expo-device').isDevice = true;
    (global as any).__DEV__ = false;
    
    // Mock an error when importing MultipeerSyncService
    jest.mock('../../../adapters/services/MultipeerSyncService', () => {
      throw new Error('Module not found');
    });
    
    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeInstanceOf(InMemorySyncService);
  });
}); 