import { InMemoryMultipeerSyncService } from '../InMemoryMultipeerSyncService';
import { SyncStatus } from '../../../ports/services/SyncingServicePort';

describe('InMemoryMultipeerSyncService', () => {
  let service: InMemoryMultipeerSyncService;

  beforeEach(() => {
    service = new InMemoryMultipeerSyncService();
  });

  it('should initialize correctly', async () => {
    const spy = jest.spyOn(console, 'log');
    await service.initialize();
    expect(spy).toHaveBeenCalledWith('InMemoryMultipeerSyncService initialized for testing');
  });

  it('should start advertising with a device name', async () => {
    const mockCallback = jest.fn();
    service.onTransferProgress(mockCallback);
    
    await service.initialize();
    await service.startAdvertising('Test Device');
    
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ 
      status: SyncStatus.IDLE, 
      progress: 0
    }));
  });

  it('should start scanning and discover mock devices', async () => {
    const deviceDiscoveredCallback = jest.fn();
    
    await service.initialize();
    service.onDeviceDiscovered(deviceDiscoveredCallback);
    await service.startScanning();
    
    expect(service['isScanning']).toBe(true);
    
    // Wait for the mock devices to be discovered
    await new Promise(resolve => setTimeout(resolve, 3100));
    
    expect(deviceDiscoveredCallback).toHaveBeenCalled();
    expect(service.getDiscoveredDevices().length).toBeGreaterThan(0);
  });

  it('should connect to a discovered device', async () => {
    const connectionStateCallback = jest.fn();
    const mockProgressCallback = jest.fn();
    
    await service.initialize();
    service.onConnectionStateChanged(connectionStateCallback);
    service.onTransferProgress(mockProgressCallback);
    await service.startScanning();
    
    // Wait for the mock devices to be discovered
    await new Promise(resolve => setTimeout(resolve, 3100));
    
    const devices = service.getDiscoveredDevices();
    expect(devices.length).toBeGreaterThan(0);
    
    const connected = await service.connectToDevice(devices[0].id);
    expect(connected).toBe(true);
    expect(connectionStateCallback).toHaveBeenCalledWith(true, devices[0].id);
    expect(mockProgressCallback).toHaveBeenCalledWith(expect.objectContaining({
      status: SyncStatus.CONNECTED,
      progress: 0
    }));
  });

  it('should send and receive data', async () => {
    const progressCallback = jest.fn();
    const testData = { type: 'test', data: { foo: 'bar' } };
    
    await service.initialize();
    service.onTransferProgress(progressCallback);
    await service.startScanning();
    
    // Wait for the mock devices to be discovered
    await new Promise(resolve => setTimeout(resolve, 3100));
    
    const devices = service.getDiscoveredDevices();
    await service.connectToDevice(devices[0].id);
    
    const sent = await service.sendData(testData);
    expect(sent).toBe(true);
    
    // Should have called progress callback with TRANSFERRING status
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      status: SyncStatus.TRANSFERRING,
      progress: expect.any(Number)
    }));
  });

  it('should disconnect properly', async () => {
    const connectionStateCallback = jest.fn();
    const progressCallback = jest.fn();
    
    await service.initialize();
    service.onConnectionStateChanged(connectionStateCallback);
    service.onTransferProgress(progressCallback);
    await service.startScanning();
    
    // Wait for the mock devices to be discovered
    await new Promise(resolve => setTimeout(resolve, 3100));
    
    const devices = service.getDiscoveredDevices();
    await service.connectToDevice(devices[0].id);
    
    await service.disconnect();
    expect(connectionStateCallback).toHaveBeenCalledWith(false);
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      status: SyncStatus.IDLE,
      progress: 0,
      message: 'Disconnected'
    }));
  });
}); 