import { ZeroconfTcpSyncService } from '../ZeroconfTcpSyncService';
import { SyncStatus } from '../../../ports/services/SyncingServicePort';

// Mocks loaded via jest.config.js moduleNameMapper:
//   react-native-zeroconf  → __mocks__/react-native-zeroconf.ts
//   react-native-tcp-socket → __mocks__/react-native-tcp-socket.ts

// Helper to reach private fields/methods during white-box testing
type Internals = {
  drainBuffer(): void;
  incomingBuffer: string;
  serviceName: string;
  zeroconf: {
    publishService: jest.Mock;
    unpublishService: jest.Mock;
    scan: jest.Mock;
    stop: jest.Mock;
    removeDeviceListeners: jest.Mock;
    on: jest.Mock;
    off: jest.Mock;
  };
};

describe('ZeroconfTcpSyncService', () => {
  let service: ZeroconfTcpSyncService;
  let internals: Internals;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ZeroconfTcpSyncService();
    internals = service as unknown as Internals;
  });

  // ── startAdvertising idempotency ────────────────────────────────────────────

  describe('startAdvertising', () => {
    it('publishes once when called once', async () => {
      await service.startAdvertising('Device A');
      expect(internals.zeroconf.publishService).toHaveBeenCalledTimes(1);
    });

    it('does not double-publish when called twice without stopping', async () => {
      await service.startAdvertising('Device A');
      await service.startAdvertising('Device A');
      expect(internals.zeroconf.publishService).toHaveBeenCalledTimes(1);
    });

    it('re-advertises after stopAdvertising', async () => {
      await service.startAdvertising('Device A');
      await service.stopAdvertising();
      await service.startAdvertising('Device A');
      expect(internals.zeroconf.publishService).toHaveBeenCalledTimes(2);
    });
  });

  // ── self-discovery ignore ───────────────────────────────────────────────────

  describe('startScanning — self-discovery', () => {
    const simulateResolved = (svc: ZeroconfTcpSyncService, name: string, host: string, txt?: Record<string, string>) => {
      const i = svc as unknown as Internals;
      const calls = i.zeroconf.on.mock.calls;
      const handler = calls.find(([event]: [string]) => event === 'resolved')?.[1];
      handler?.({ name, host, port: 47834, addresses: [host], txt });
    };

    it('ignores its own mDNS advertisement', async () => {
      const onDiscovered = jest.fn();
      service.onDeviceDiscovered(onDiscovered);
      await service.startAdvertising('My Device');
      await service.startScanning();

      // Use the unique serviceName (with random suffix) to simulate self-discovery
      simulateResolved(service, internals.serviceName, '192.168.1.1');

      expect(onDiscovered).not.toHaveBeenCalled();
      expect(service.getDiscoveredDevices()).toHaveLength(0);
    });

    it('does not filter a peer that shares the same display name', async () => {
      const onDiscovered = jest.fn();
      service.onDeviceDiscovered(onDiscovered);
      await service.startAdvertising('My Device');
      await service.startScanning();

      // Same display name but different mDNS service name (different device)
      simulateResolved(service, 'My Device [beef]', '192.168.1.2', { displayName: 'My Device' });

      expect(onDiscovered).toHaveBeenCalledTimes(1);
      expect(service.getDiscoveredDevices()).toHaveLength(1);
      expect(service.getDiscoveredDevices()[0].name).toBe('My Device');
    });

    it('adds a peer device and uses displayName from TXT record', async () => {
      const onDiscovered = jest.fn();
      service.onDeviceDiscovered(onDiscovered);
      await service.startAdvertising('My Device');
      await service.startScanning();

      simulateResolved(service, "Peer's Device [1234]", '192.168.1.2', { displayName: "Peer's Device" });

      expect(onDiscovered).toHaveBeenCalledTimes(1);
      expect(service.getDiscoveredDevices()).toHaveLength(1);
      expect(service.getDiscoveredDevices()[0].name).toBe("Peer's Device");
      expect(service.getDiscoveredDevices()[0].id).toBe("Peer's Device [1234]");
    });

    it('falls back to service.name when no TXT displayName', async () => {
      const onDiscovered = jest.fn();
      service.onDeviceDiscovered(onDiscovered);
      await service.startAdvertising('My Device');
      await service.startScanning();

      simulateResolved(service, "Legacy Device", '192.168.1.3');

      expect(service.getDiscoveredDevices()[0].name).toBe("Legacy Device");
    });

    it('removes a device on the remove event', async () => {
      await service.startScanning();
      simulateResolved(service, "Peer's Device [abcd]", '192.168.1.2', { displayName: "Peer's Device" });

      const i = internals;
      const removeCalls = i.zeroconf.on.mock.calls;
      const removeHandler = removeCalls.find(([event]: [string]) => event === 'remove')?.[1];
      removeHandler?.("Peer's Device [abcd]");

      expect(service.getDiscoveredDevices()).toHaveLength(0);
    });
  });

  // ── null-byte message framing ───────────────────────────────────────────────

  describe('TCP message framing (null-byte delimiter)', () => {
    it('dispatches a complete single-chunk message', () => {
      const received: unknown[] = [];
      service.setAutoDataReceptionCallback((data) => received.push(data));

      internals.incomingBuffer = JSON.stringify({ hello: 'world' }) + '\0';
      internals.drainBuffer();

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ hello: 'world' });
    });

    it('does not dispatch an incomplete message (no delimiter yet)', () => {
      const received: unknown[] = [];
      service.setAutoDataReceptionCallback((data) => received.push(data));

      internals.incomingBuffer = '{"a":1';
      internals.drainBuffer();

      expect(received).toHaveLength(0);
    });

    it('dispatches after the delimiter arrives in a second chunk', () => {
      const received: unknown[] = [];
      service.setAutoDataReceptionCallback((data) => received.push(data));

      internals.incomingBuffer = '{"a":1';
      internals.drainBuffer();
      internals.incomingBuffer += '}\0';
      internals.drainBuffer();

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ a: 1 });
    });

    it('dispatches two messages arriving in the same chunk', () => {
      const received: unknown[] = [];
      service.setAutoDataReceptionCallback((data) => received.push(data));

      internals.incomingBuffer = '{"x":1}\0{"x":2}\0';
      internals.drainBuffer();

      expect(received).toHaveLength(2);
      expect(received[0]).toEqual({ x: 1 });
      expect(received[1]).toEqual({ x: 2 });
    });

    it('emits ERROR progress and continues on malformed JSON', () => {
      const progressEvents: Array<{ status: string }> = [];
      service.onTransferProgress((p) => progressEvents.push(p as { status: string }));

      internals.incomingBuffer = 'not-json\0{"ok":true}\0';
      internals.drainBuffer();

      expect(progressEvents.some((p) => p.status === SyncStatus.ERROR)).toBe(true);
    });
  });

  // ── dispatchData — routing ──────────────────────────────────────────────────

  describe('dispatchData routing', () => {
    it('does not deliver to autoDataReceptionCallback when receiveDataResolver is active', async () => {
      const autoReceived: unknown[] = [];
      service.setAutoDataReceptionCallback((data) => autoReceived.push(data));

      // Set up a receiveDataResolver by calling receiveData
      const dataPromise = service.receiveData();

      internals.incomingBuffer = '{"via":"resolver"}\0';
      internals.drainBuffer();

      const result = await dataPromise;
      // Data went to resolver, not to autoDataReceptionCallback
      expect(result).toEqual({ via: 'resolver' });
      expect(autoReceived).toHaveLength(0);
    });

    it('delivers to receiveDataResolver when set', async () => {
      const dataPromise = service.receiveData();

      internals.incomingBuffer = '{"via":"resolver"}\0';
      internals.drainBuffer();

      const result = await dataPromise;
      expect(result).toEqual({ via: 'resolver' });
    });

    it('delivers to autoDataReceptionCallback when no resolver is pending', () => {
      const received: unknown[] = [];
      service.setAutoDataReceptionCallback((data) => received.push(data));

      internals.incomingBuffer = '{"via":"callback"}\0';
      internals.drainBuffer();

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ via: 'callback' });
    });
  });
});
