import { AndroidMultipeerSyncService } from '../AndroidMultipeerSyncService';
import { SyncStatus } from '../../../ports/services/SyncingServicePort';
import { Platform } from 'react-native';

// Mock RNMultipeer
jest.mock('react-native-multipeer', () => {
  const eventListeners: Record<string, Array<(data: any) => void>> = {};
  
  return {
    default: {
      addEventListener: jest.fn((event: string, callback: (data: any) => void) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
      }),
      removeEventListener: jest.fn((event: string, callback: (data: any) => void) => {
        if (eventListeners[event]) {
          const index = eventListeners[event].indexOf(callback);
          if (index > -1) {
            eventListeners[event].splice(index, 1);
          }
        }
      }),
      advertise: jest.fn(() => Promise.resolve()),
      stopAdvertising: jest.fn(() => Promise.resolve()),
      browse: jest.fn(() => Promise.resolve()),
      stopBrowsing: jest.fn(() => Promise.resolve()),
      invite: jest.fn(() => Promise.resolve()),
      send: jest.fn(() => Promise.resolve()),
      _eventListeners: eventListeners,
      _triggerEvent: (event: string, data: any) => {
        if (eventListeners[event]) {
          eventListeners[event].forEach((callback: (data: any) => void) => callback(data));
        }
      }
    }
  };
});

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android'
  }
}));

describe('AndroidMultipeerSyncService', () => {
  let service: AndroidMultipeerSyncService;
  let RNMultipeer: any;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get reference to the mocked module
    RNMultipeer = require('react-native-multipeer');
    
    // Create service instance
    service = new AndroidMultipeerSyncService();
  });
  
  it('should initialize correctly on Android', async () => {
    await service.initialize();
    
    expect(RNMultipeer.default.addEventListener).toHaveBeenCalledTimes(5);
    expect(RNMultipeer.default.addEventListener).toHaveBeenCalledWith('peerFound', expect.any(Function));
    expect(RNMultipeer.default.addEventListener).toHaveBeenCalledWith('peerLost', expect.any(Function));
    expect(RNMultipeer.default.addEventListener).toHaveBeenCalledWith('connectedPeersChanged', expect.any(Function));
    expect(RNMultipeer.default.addEventListener).toHaveBeenCalledWith('dataReceived', expect.any(Function));
    expect(RNMultipeer.default.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });
  
  it('should throw error if initialized on non-Android platform', async () => {
    // Override Platform.OS
    (Platform as any).OS = 'ios';
    
    await expect(service.initialize()).rejects.toThrow('AndroidMultipeerSyncService can only be used on Android devices');
    
    // Restore Platform.OS
    (Platform as any).OS = 'android';
  });
  
  it('should start advertising', async () => {
    await service.startAdvertising('Test Device');
    
    expect(RNMultipeer.default.advertise).toHaveBeenCalledWith('hemea-sync-service', 'Test Device');
  });
  
  it('should start scanning and clear discovered devices', async () => {
    // Add a mock device first
    (service as any).discoveredDevices.set('device1', { id: 'device1', name: 'Device 1' });
    
    await service.startScanning();
    
    expect(RNMultipeer.default.browse).toHaveBeenCalledWith('hemea-sync-service');
    expect(service.getDiscoveredDevices()).toHaveLength(0);
  });
  
  it('should connect to device', async () => {
    const result = await service.connectToDevice('device1');
    
    expect(RNMultipeer.default.invite).toHaveBeenCalledWith('device1');
    expect(result).toBe(true);
  });
  
  it('should handle device discovery events', async () => {
    await service.initialize();
    
    const mockDevice = { peerId: 'device1', peerName: 'Device 1' };
    const deviceDiscoveredCallback = jest.fn();
    
    service.onDeviceDiscovered(deviceDiscoveredCallback);
    
    // Trigger a peerFound event
    RNMultipeer.default._triggerEvent('peerFound', mockDevice);
    
    expect(deviceDiscoveredCallback).toHaveBeenCalledWith({ id: 'device1', name: 'Device 1' });
    expect(service.getDiscoveredDevices()).toContainEqual({ id: 'device1', name: 'Device 1' });
  });
  
  it('should handle connection state changes', async () => {
    await service.initialize();
    
    const connectionStateCallback = jest.fn();
    service.onConnectionStateChanged(connectionStateCallback);
    
    // Simulate connecting to a device
    await service.connectToDevice('device1');
    
    // Trigger a connectedPeersChanged event
    RNMultipeer.default._triggerEvent('connectedPeersChanged', { connectedPeers: ['device1'] });
    
    expect(connectionStateCallback).toHaveBeenCalledWith(true, 'device1');
  });
  
  it('should send data', async () => {
    const data = { test: 'data' };
    const progressCallback = jest.fn();
    
    service.onTransferProgress(progressCallback);
    
    const result = await service.sendData(data);
    
    expect(RNMultipeer.default.send).toHaveBeenCalledWith(JSON.stringify(data));
    expect(result).toBe(true);
    
    // Should have called progress callback with TRANSFERRING status
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      status: SyncStatus.TRANSFERRING,
      progress: expect.any(Number)
    }));
  });
  
  it('should clean up when disconnecting', async () => {
    await service.initialize();
    await service.disconnect();
    
    expect(RNMultipeer.default.stopAdvertising).toHaveBeenCalled();
    expect(RNMultipeer.default.stopBrowsing).toHaveBeenCalled();
    expect(RNMultipeer.default.removeEventListener).toHaveBeenCalledTimes(5);
  });
}); 